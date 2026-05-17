"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover shadow-[var(--shadow-xs)]",
  secondary:
    "bg-surface-2 text-text border border-border hover:bg-surface-3 hover:border-border-strong",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  danger:
    "bg-danger text-danger-fg hover:opacity-90 shadow-[var(--shadow-xs)]",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-md",
  icon: "h-9 w-9 rounded-md",
};

const BASE =
  "inline-flex items-center justify-center font-medium select-none whitespace-nowrap " +
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out " +
  "active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className = "",
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leftIcon
      )}
      {size !== "icon" && children}
      {!loading && rightIcon}
    </button>
  );
});
