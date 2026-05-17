import type { ReactNode } from "react";

interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className = "" }: KbdProps) {
  return (
    <kbd
      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-sm border border-border bg-surface-2 px-1.5 font-mono text-[11px] font-medium text-muted shadow-[var(--shadow-xs)] ${className}`}
    >
      {children}
    </kbd>
  );
}
