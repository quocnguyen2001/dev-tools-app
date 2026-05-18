/**
 * Identifier for a formatter language. Sourced dynamically from
 * `GET /api/v1/types`, so this is intentionally an open `string` rather than
 * a literal union. Lookup tables that key on this type must handle unknown
 * values gracefully (see `toMonacoLanguage`, `getSampleCode`).
 */
export type FormatTypeValue = string;

export interface FormatType {
  value: FormatTypeValue;
  label: string;
  icon?: string;
}

export interface Preset {
  value: string;
  label: string;
  description?: string;
}

export type TrailingComma = "none" | "es5" | "all";
export type ArrowParens = "always" | "avoid";
export type EndOfLine = "lf" | "crlf" | "cr" | "auto";

export interface PrettierOptions {
  printWidth: number;
  tabWidth: number;
  useTabs: boolean;
  semi: boolean;
  singleQuote: boolean;
  trailingComma: TrailingComma;
  bracketSpacing: boolean;
  arrowParens: ArrowParens;
  endOfLine: EndOfLine;
}

export interface FormatRequest {
  code: string;
  type: FormatTypeValue;
  preset: string;
  prettier_options?: PrettierOptions;
}

export interface FormatResponseData {
  code: string;
  type: FormatTypeValue;
  preset: string;
}

export interface FormatResponseMeta {
  bytes_in: number;
  bytes_out: number;
}

export type ViewMode = "single" | "split" | "diff";
export type EditorTheme = "vs" | "vs-dark";
