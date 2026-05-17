import type { FormatTypeValue } from "@/types/formatter";

export const TYPE_TO_MONACO_LANGUAGE: Record<FormatTypeValue, string> = {
  json: "json",
  html: "html",
  css: "css",
  javascript: "javascript",
  sql: "sql",
};

export function toMonacoLanguage(type: string | undefined): string {
  if (!type) return "plaintext";
  return TYPE_TO_MONACO_LANGUAGE[type as FormatTypeValue] ?? "plaintext";
}
