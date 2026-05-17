"use client";

import { useState, type ChangeEvent } from "react";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import type {
  ArrowParens,
  EndOfLine,
  PrettierOptions,
  TrailingComma,
} from "@/types/formatter";

interface PrettierOptionsFormProps {
  value: PrettierOptions;
  onChange: (next: PrettierOptions) => void;
}

const TRAILING_COMMA = [
  { value: "none", label: "None" },
  { value: "es5", label: "ES5" },
  { value: "all", label: "All" },
] as const;

const ARROW_PARENS = [
  { value: "always", label: "Always" },
  { value: "avoid", label: "Avoid" },
] as const;

const END_OF_LINE = [
  { value: "lf", label: "LF" },
  { value: "crlf", label: "CRLF" },
  { value: "cr", label: "CR" },
  { value: "auto", label: "Auto" },
] as const;

export function PrettierOptionsForm({ value, onChange }: PrettierOptionsFormProps) {
  const [collapsed, setCollapsed] = useState(false);

  const update = <K extends keyof PrettierOptions>(key: K, next: PrettierOptions[K]) => {
    onChange({ ...value, [key]: next });
  };

  const handleNumber =
    (key: "printWidth" | "tabWidth", min: number, max: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const parsed = Number.parseInt(event.target.value, 10);
      if (Number.isNaN(parsed)) return;
      update(key, Math.min(max, Math.max(min, parsed)));
    };

  return (
    <section
      aria-labelledby="prettier-config-heading"
      className="border-t border-border bg-surface-1 p-4"
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 22V12M2 7L12 12M12 12L22 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2
            id="prettier-config-heading"
            className="text-[12px] font-semibold uppercase tracking-wide text-muted"
          >
            Prettier Configuration
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-controls="prettier-config-body"
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{
              transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 150ms ease-out",
            }}
          >
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {collapsed ? "Show" : "Hide"}
        </button>
      </header>

      {!collapsed && (
        <div
          id="prettier-config-body"
          className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3"
        >
          <NumberField
            id="prettier-printWidth"
            label="Print Width"
            value={value.printWidth}
            onChange={handleNumber("printWidth", 40, 200)}
            min={40}
            max={200}
            help="Wrap lines longer than this width."
          />

          <NumberField
            id="prettier-tabWidth"
            label="Tab Width"
            value={value.tabWidth}
            onChange={handleNumber("tabWidth", 1, 8)}
            min={1}
            max={8}
            help="Spaces per indentation level."
          />

          <SelectField label="Trailing Comma" help="Where to print trailing commas in arrays and objects.">
            <Select<TrailingComma>
              size="sm"
              value={value.trailingComma}
              onChange={(next) => update("trailingComma", next)}
              options={TRAILING_COMMA}
              triggerClassName="w-full"
            />
          </SelectField>

          <SelectField
            label="Arrow Parens"
            help="Always include parens around a sole arrow function param."
          >
            <Select<ArrowParens>
              size="sm"
              value={value.arrowParens}
              onChange={(next) => update("arrowParens", next)}
              options={ARROW_PARENS}
              triggerClassName="w-full"
            />
          </SelectField>

          <SelectField label="End of Line" help="Line ending style for the formatted output.">
            <Select<EndOfLine>
              size="sm"
              value={value.endOfLine}
              onChange={(next) => update("endOfLine", next)}
              options={END_OF_LINE}
              triggerClassName="w-full"
            />
          </SelectField>

          <ToggleField
            id="prettier-useTabs"
            label="Use Tabs"
            checked={value.useTabs}
            onChange={(next) => update("useTabs", next)}
          />
          <ToggleField
            id="prettier-semi"
            label="Semicolons"
            checked={value.semi}
            onChange={(next) => update("semi", next)}
          />
          <ToggleField
            id="prettier-singleQuote"
            label="Single Quotes"
            checked={value.singleQuote}
            onChange={(next) => update("singleQuote", next)}
          />
          <ToggleField
            id="prettier-bracketSpacing"
            label="Bracket Spacing"
            checked={value.bracketSpacing}
            onChange={(next) => update("bracketSpacing", next)}
          />
        </div>
      )}
    </section>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  help?: string;
}

function NumberField({ id, label, value, onChange, min, max, help }: NumberFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-wide text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="h-8 w-full rounded-md border border-border bg-surface-1 px-2 font-mono text-[13px] text-text transition-colors focus:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-1"
      />
      {help && <p className="text-[11px] leading-snug text-subtle">{help}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  help?: string;
  children: React.ReactNode;
}

function SelectField({ label, help, children }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
      {help && <p className="text-[11px] leading-snug text-subtle">{help}</p>}
    </div>
  );
}

interface ToggleFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleField({ id, label, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-surface-1 px-2">
        <Switch id={id} checked={checked} onCheckedChange={onChange} aria-label={label} />
        <label htmlFor={id} className="cursor-pointer select-none text-[13px] text-muted">
          {checked ? "Enabled" : "Disabled"}
        </label>
      </div>
    </div>
  );
}
