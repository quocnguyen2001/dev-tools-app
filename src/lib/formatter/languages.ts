import type { FormatTypeValue } from "@/types/formatter";

/**
 * Mapping for cases where the backend type id differs from Monaco's
 * language id. For values not listed here, the type id itself is used,
 * which Monaco handles gracefully (falling back to plaintext if unknown).
 */
export const TYPE_TO_MONACO_LANGUAGE: Record<FormatTypeValue, string> = {
  json: "json",
  html: "html",
  css: "css",
  javascript: "javascript",
  sql: "sql",
};

export function toMonacoLanguage(type: string | undefined): string {
  if (!type) return "plaintext";
  return TYPE_TO_MONACO_LANGUAGE[type] ?? type;
}
