export type FormatTypeValue = "json" | "html" | "css" | "javascript" | "sql";

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
