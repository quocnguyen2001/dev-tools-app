"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

interface PopoverProps {
  trigger: ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
    "aria-haspopup"?: string;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
    id?: string;
  }>;
  children: ReactNode;
  align?: "start" | "end";
  width?: number;
  ariaLabel?: string;
}

export function Popover({
  trigger,
  children,
  align = "end",
  width = 320,
  ariaLabel,
}: PopoverProps) {
  const reactId = useId();
  const triggerId = `popover-trigger-${reactId}`;
  const panelId = `popover-panel-${reactId}`;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => lastFocusedRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => panelRef.current?.focus());

    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Focus trap inside the popover.
  const handleTrap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        id: triggerId,
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": panelId,
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          setOpen((o) => !o);
        },
      })
    : trigger;

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {triggerEl}
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={ariaLabel}
          tabIndex={-1}
          onKeyDown={handleTrap}
          style={{ width }}
          className={[
            "animate-popover-in absolute top-full z-40 mt-1 rounded-lg border border-border bg-surface-2 p-4 shadow-[var(--shadow-lg)] focus:outline-none",
            align === "end" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {children}
        </div>
      )}
    </div>
  );
}
