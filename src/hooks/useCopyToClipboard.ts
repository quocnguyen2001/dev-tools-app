"use client";

import { useCallback } from "react";

export function useCopyToClipboard() {
  return useCallback(async (text: string): Promise<boolean> => {
    if (!text) return false;

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to legacy fallback below.
      }
    }

    if (typeof document === "undefined") return false;

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.select();

    try {
      // execCommand is deprecated but still the most reliable fallback for
      // older browsers and non-secure contexts.
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }, []);
}
