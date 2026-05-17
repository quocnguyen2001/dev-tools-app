"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

const AUTO_DISMISS_MS = 3000;
const MAX_TOASTS = 3;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message: string, type: ToastType = "info") => {
      idRef.current += 1;
      const id = idRef.current;
      const next: Toast = { id, message, type, duration: AUTO_DISMISS_MS };
      setToasts((current) => {
        // Newest on top; cap stack length.
        const merged = [next, ...current];
        if (merged.length <= MAX_TOASTS) return merged;
        const dropped = merged.slice(MAX_TOASTS);
        for (const d of dropped) {
          const t = timersRef.current.get(d.id);
          if (t) {
            clearTimeout(t);
            timersRef.current.delete(d.id);
          }
        }
        return merged.slice(0, MAX_TOASTS);
      });
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return { toasts, push, dismiss };
}

export type ToastApi = ReturnType<typeof useToast>;
