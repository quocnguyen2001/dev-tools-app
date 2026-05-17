"use client";

import { useEffect, useRef, useState } from "react";
import type { Toast as ToastModel, ToastType } from "@/hooks/useToast";

interface ToastProps {
  toast: ToastModel;
  onDismiss: (id: number) => void;
}

const TYPE_STYLES: Record<ToastType, { wrap: string; bar: string; icon: string }> = {
  success: {
    wrap: "border-success/40 bg-success-muted text-success-muted-fg",
    bar: "bg-success",
    icon: "text-success",
  },
  error: {
    wrap: "border-danger/40 bg-danger-muted text-danger-muted-fg",
    bar: "bg-danger",
    icon: "text-danger",
  },
  info: {
    wrap: "border-info/40 bg-info-muted text-info-muted-fg",
    bar: "bg-info",
    icon: "text-info",
  },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 12L11 15L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const styles = TYPE_STYLES[toast.type];
  const [paused, setPaused] = useState(false);
  // Re-mount the bar via key change to restart animation when duration changes.
  const barRef = useRef<HTMLDivElement | null>(null);

  // Pause auto-dismiss timer at the parent level isn't trivial; keep visual
  // pause on the progress bar and let the parent timeout fire as scheduled.
  // Hover briefly delays the dismissal feel by holding the bar's progress.
  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.animationPlayState = paused ? "paused" : "running";
  }, [paused]);

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={[
        "relative flex min-w-[280px] max-w-[440px] items-start gap-3 overflow-hidden rounded-md border bg-surface-2 px-3 py-3 shadow-[var(--shadow-md)]",
        styles.wrap,
      ].join(" ")}
    >
      <span className={`mt-0.5 shrink-0 ${styles.icon}`}>{ICONS[toast.type]}</span>
      <span className="flex-1 text-[13px] font-medium leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-sm p-0.5 text-current/70 transition-colors hover:bg-black/10 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <span
        ref={barRef}
        aria-hidden="true"
        style={{ animationDuration: `${toast.duration}ms` }}
        className={`animate-toast-progress absolute bottom-0 left-0 h-[2px] w-full ${styles.bar}`}
      />
    </div>
  );
}
