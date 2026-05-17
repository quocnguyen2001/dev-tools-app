"use client";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      disabled={disabled}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onClick={() => onCheckedChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent" : "bg-surface-3 border border-border",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform duration-150 ease-out",
          checked ? "translate-x-[18px]" : "translate-x-[2px]",
        ].join(" ")}
      />
    </button>
  );
}
