"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: Theme) => void;
}

const STORAGE_KEY = "dev-tools-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // localStorage may be unavailable (sandboxed iframes, privacy mode).
  }
  return "dark";
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Hydrate from storage / system synchronously during the first client render
  // so we never call setState inside an effect (Next 16 + React 19 rule).
  // Default theme is "dark" — this is a code editor and dark is the expected baseline.
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [hydrated, setHydrated] = useState(false);

  if (!hydrated && typeof window !== "undefined") {
    const stored = readStoredTheme();
    const next: ResolvedTheme = stored === "system" ? readSystemTheme() : stored;
    setHydrated(true);
    setThemeState(stored);
    setResolvedTheme(next);
  }

  // DOM side effect runs after render, never inside the same tick as setState.
  useEffect(() => {
    if (!hydrated) return;
    applyTheme(resolvedTheme);
  }, [hydrated, resolvedTheme]);

  // Track system changes only when theme === "system".
  useEffect(() => {
    if (!hydrated) return;
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      setResolvedTheme(event.matches ? "dark" : "light");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, hydrated]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore quota / privacy errors — runtime state still works.
      }
    }
    setResolvedTheme(next === "system" ? readSystemTheme() : next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}

/**
 * Inline script that applies the persisted theme before React hydrates so
 * users never see a flash of the wrong palette. Designed to be small and
 * self-contained — no external bindings.
 */
export const THEME_INIT_SCRIPT = `(() => {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var resolved;
    if (stored === 'light' || stored === 'dark') {
      resolved = stored;
    } else if (stored === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = 'dark';
    }
    var root = document.documentElement;
    if (resolved === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = resolved;
  } catch (e) {}
})();`;
