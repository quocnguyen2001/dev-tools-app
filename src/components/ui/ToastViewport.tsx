"use client";

import type { Toast as ToastModel } from "@/hooks/useToast";
import { Toast } from "./Toast";

interface ToastViewportProps {
  toasts: ToastModel[];
  onDismiss: (id: number) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] sm:bottom-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto animate-toast-in">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
