"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  "aria-label": string;
  variant?: ButtonVariant;
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ icon, variant = "ghost", ...rest }, ref) {
    return (
      <Button ref={ref} size="icon" variant={variant} leftIcon={icon} {...rest} />
    );
  },
);
