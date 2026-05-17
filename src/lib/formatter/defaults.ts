import type { FormatTypeValue, PrettierOptions } from "@/types/formatter";

export const DEFAULT_PRETTIER_OPTIONS: PrettierOptions = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
};

const PRETTIER_TYPES: ReadonlyArray<FormatTypeValue> = ["javascript", "html", "css"];

export function isPrettierApplicable(preset: string, type: FormatTypeValue): boolean {
  return preset === "prettier" && PRETTIER_TYPES.includes(type);
}
