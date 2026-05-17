"use client";

import { useRef } from "react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { IconButton } from "@/components/ui/IconButton";
import { Kbd } from "@/components/ui/Kbd";
import { Popover } from "@/components/ui/Popover";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const Logo = () => (
  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-fg shadow-[var(--shadow-sm)]">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 3L4 7V17L8 21M16 3L20 7V17L16 21M12 7V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </span>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const SystemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 20H16M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12.02c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.95 10.95 0 0 1 5.74 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.36-5.27 5.65.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12.02C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

const QuestionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SHORTCUTS = [
  { combo: ["⌘", "Enter"], desc: "Format code" },
  { combo: ["⌘", "Shift", "C"], desc: "Copy output" },
  { combo: ["⌘", "K"], desc: "Focus language picker" },
  { combo: ["?"], desc: "Show keyboard shortcuts" },
  { combo: ["Esc"], desc: "Close menus and popovers" },
];

interface AppHeaderProps {
  /** Reserved for callers that want to programmatically open the help popover. */
  onShortcutHelp?: () => void;
}

export function AppHeader(_props: AppHeaderProps = {}) {
  // Currently unused but reserved for future wiring; suppress unused warnings.
  void _props;
  const { theme, setTheme } = useTheme();
  const helpTriggerRef = useRef<HTMLButtonElement | null>(null);

  // ? toggles the keyboard shortcut popover.
  useKeyboardShortcut([
    {
      combo: "?",
      handler: () => helpTriggerRef.current?.click(),
    },
    {
      combo: "shift+?",
      handler: () => helpTriggerRef.current?.click(),
    },
  ]);

  const themeItems: Array<{
    key: Theme;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: "light", label: "Light", icon: <SunIcon /> },
    { key: "dark", label: "Dark", icon: <MoonIcon /> },
    { key: "system", label: "System", icon: <SystemIcon /> },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface-1/80 backdrop-blur supports-[backdrop-filter]:bg-surface-1/70">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-col leading-tight">
            <h1 className="text-[15px] font-semibold tracking-tight text-text">
              Format Hub
            </h1>
            <p className="hidden text-[11px] text-subtle sm:block">
              Code formatter for developers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Popover
            ariaLabel="Keyboard shortcuts"
            width={320}
            trigger={
              <IconButton
                ref={helpTriggerRef}
                aria-label="Keyboard shortcuts"
                icon={<QuestionIcon />}
                variant="ghost"
              />
            }
          >
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted">
              Keyboard Shortcuts
            </h2>
            <ul className="flex flex-col gap-2">
              {SHORTCUTS.map((s) => (
                <li
                  key={s.desc}
                  className="flex items-center justify-between gap-3 text-[13px]"
                >
                  <span className="text-text">{s.desc}</span>
                  <span className="flex items-center gap-1">
                    {s.combo.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </Popover>

          <DropdownMenu
            ariaLabel="Theme"
            width={180}
            trigger={
              <IconButton
                aria-label="Toggle theme"
                variant="ghost"
                icon={
                  theme === "light" ? <SunIcon /> : theme === "dark" ? <MoonIcon /> : <SystemIcon />
                }
              />
            }
            items={themeItems.map((it) => ({
              key: it.key,
              label: it.label,
              icon: it.icon,
              selected: theme === it.key,
              onSelect: () => setTheme(it.key),
            }))}
          />

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </header>
  );
}
