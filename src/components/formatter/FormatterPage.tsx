"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./AppHeader";
import { CodeEditor } from "./MonacoEditor";
import { DiffEditor } from "./DiffEditor";
import { FormatterToolbar } from "./FormatterToolbar";
import { PrettierOptionsForm } from "./PrettierOptions";
import { Kbd } from "@/components/ui/Kbd";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { useTheme } from "@/components/ThemeProvider";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import {
  useKeyboardShortcut,
  type KeyboardShortcut,
} from "@/hooks/useKeyboardShortcut";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";
import { formatCode, getPresets } from "@/lib/api/formatter";
import {
  DEFAULT_PRETTIER_OPTIONS,
  isPrettierApplicable,
} from "@/lib/formatter/defaults";
import { toMonacoLanguage } from "@/lib/formatter/languages";
import { getSampleCode } from "@/lib/formatter/samples";
import { formatBytes } from "@/lib/utils/format";
import type {
  FormatRequest,
  FormatType,
  FormatTypeValue,
  Preset,
  PrettierOptions,
  ViewMode,
} from "@/types/formatter";

interface FormatterPageProps {
  initialTypes: FormatType[];
  initialType: FormatTypeValue;
  initialPresets: Preset[];
  initialError?: string;
}

interface BytesMeta {
  bytes_in: number;
  bytes_out: number;
}

export function FormatterPage({
  initialTypes,
  initialType,
  initialPresets,
  initialError,
}: FormatterPageProps) {
  const toast = useToast();
  const copy = useCopyToClipboard();
  const { resolvedTheme } = useTheme();
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";

  const [type, setType] = useState<FormatTypeValue>(initialType);
  const [prevType, setPrevType] = useState<FormatTypeValue>(initialType);
  const [presets, setPresets] = useState<Preset[]>(initialPresets);
  const [preset, setPreset] = useState<string>(initialPresets[0]?.value ?? "default");

  const [input, setInput] = useState<string>(getSampleCode(initialType));
  const [output, setOutput] = useState<string>("");

  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [loading, setLoading] = useState(false);
  const [prettierOpts, setPrettierOpts] = useState<PrettierOptions>(DEFAULT_PRETTIER_OPTIONS);
  const [lastMeta, setLastMeta] = useState<BytesMeta | null>(null);

  const [debouncedInput, setDebouncedInput] = useState<string>(input);
  const [debouncedOutput, setDebouncedOutput] = useState<string>(output);

  const language = useMemo(() => toMonacoLanguage(type), [type]);
  const showPrettier = isPrettierApplicable(preset, type);

  const languageTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Reset sample/output and exit diff view when language changes (during render).
  if (prevType !== type) {
    setPrevType(type);
    setInput(getSampleCode(type));
    setOutput("");
    setLastMeta(null);
    setViewMode((current) => (current === "diff" ? "split" : current));
  }

  useEffect(() => {
    if (initialError) toast.push(initialError, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialError]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const next = await getPresets(type, { signal: controller.signal });
        if (cancelled) return;
        setPresets(next);
        setPreset(next[0]?.value ?? "default");
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        const message =
          err instanceof ApiError ? err.message : "Failed to load presets";
        toast.push(message, "error");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useDebouncedEffect(
    () => {
      setDebouncedInput(input);
      setDebouncedOutput(output);
    },
    150,
    [input, output],
  );

  const handleFormat = useCallback(async () => {
    if (!input.trim()) {
      toast.push("Please enter some code", "error");
      return;
    }

    setLoading(true);
    try {
      const payload: FormatRequest = { code: input, type, preset };
      if (showPrettier) payload.prettier_options = prettierOpts;

      const result = await formatCode(payload);
      setOutput(result.data.code);
      setLastMeta(result.meta);
      toast.push(
        `Formatted • ${formatBytes(result.meta.bytes_in)} in / ${formatBytes(result.meta.bytes_out)} out`,
        "success",
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Network error while formatting";
      toast.push(message, "error");
    } finally {
      setLoading(false);
    }
  }, [input, type, preset, showPrettier, prettierOpts, toast]);

  const handleCopy = useCallback(async () => {
    if (!output) {
      toast.push("No code to copy", "error");
      return;
    }
    const ok = await copy(output);
    toast.push(
      ok ? "Code copied to clipboard" : "Unable to copy code",
      ok ? "info" : "error",
    );
  }, [output, copy, toast]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setLastMeta(null);
    setViewMode((current) => (current === "diff" ? "split" : current));
    toast.push("Cleared", "info");
  }, [toast]);

  const handlePresetChange = useCallback((next: string) => {
    setPreset(next);
  }, []);

  const focusLanguageSelect = useCallback(() => {
    languageTriggerRef.current?.focus();
    languageTriggerRef.current?.click();
  }, []);

  // Keyboard shortcuts. ⌘+Enter is allowed inside the editor; others are not.
  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      { combo: "mod+enter", handler: handleFormat, allowInEditor: true },
      { combo: "mod+shift+c", handler: handleCopy, allowInEditor: true },
      { combo: "mod+k", handler: focusLanguageSelect },
    ],
    [handleFormat, handleCopy, focusLanguageSelect],
  );
  useKeyboardShortcut(shortcuts);

  const inputLines = input ? input.split("\n").length : 0;
  const outputLines = output ? output.split("\n").length : 0;
  const inputChars = input.length;
  const outputChars = output.length;
  const presetLabel = presets.find((p) => p.value === preset)?.label ?? preset;

  return (
    <div className="flex h-full flex-col bg-surface-0 text-text">
      <AppHeader />

      <FormatterToolbar
        types={initialTypes}
        selectedType={type}
        onTypeChange={setType}
        presets={presets}
        selectedPreset={preset}
        onPresetChange={handlePresetChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        inputEmpty={!input.trim()}
        outputEmpty={!output}
        onFormat={handleFormat}
        onCopy={handleCopy}
        onClear={handleClear}
        languageTriggerRef={languageTriggerRef}
      />

      <main className="relative flex-1 overflow-hidden bg-surface-0">
        {viewMode === "diff" ? (
          <div className="flex h-full flex-col">
            <PanelHeader
              title="Diff View"
              right={
                <span className="rounded-sm bg-accent-muted px-2 py-0.5 text-[11px] font-medium text-accent-muted-fg">
                  Original ↔ Formatted
                </span>
              }
            />
            <div className="flex-1 min-h-0 bg-surface-0">
              <DiffEditor
                original={debouncedInput}
                modified={debouncedOutput}
                language={language}
                theme={monacoTheme}
              />
            </div>
          </div>
        ) : viewMode === "single" ? (
          <div className="flex h-full flex-col">
            <PanelHeader
              title="Output"
              right={
                output ? (
                  <Badge tone="success">Formatted</Badge>
                ) : (
                  <Badge tone="muted">Empty</Badge>
                )
              }
            />
            {loading && <FormatProgressBar />}
            <div className="flex-1 min-h-0 bg-surface-0">
              {output ? (
                <CodeEditor
                  value={output}
                  language={language}
                  theme={monacoTheme}
                  readOnly
                />
              ) : (
                <EmptyOutput />
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col md:flex-row">
            <div className="flex flex-1 flex-col border-b border-border md:border-b-0 md:border-r">
              <PanelHeader
                title="Input"
                right={<Badge tone="muted">{type.toUpperCase()}</Badge>}
              />
              <div className="flex-1 min-h-0 bg-surface-0">
                <CodeEditor
                  value={input}
                  language={language}
                  theme={monacoTheme}
                  onChange={setInput}
                />
              </div>
              {showPrettier && (
                <PrettierOptionsForm value={prettierOpts} onChange={setPrettierOpts} />
              )}
            </div>

            <div className="flex flex-1 flex-col">
              <PanelHeader
                title="Output"
                right={output ? <Badge tone="success">Formatted</Badge> : null}
              />
              {loading && <FormatProgressBar />}
              <div className="flex-1 min-h-0 bg-surface-0">
                {output ? (
                  <CodeEditor
                    value={output}
                    language={language}
                    theme={monacoTheme}
                    readOnly
                  />
                ) : (
                  <EmptyOutput />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <StatusBar
        type={type}
        presetLabel={presetLabel}
        inputLines={inputLines}
        outputLines={outputLines}
        inputChars={inputChars}
        outputChars={outputChars}
        meta={lastMeta}
        loading={loading}
      />

      <ToastViewport toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  right?: React.ReactNode;
}

function PanelHeader({ title, right }: PanelHeaderProps) {
  return (
    <div className="flex h-9 items-center justify-between border-b border-border bg-surface-1 px-4">
      <h2
        role="heading"
        aria-level={2}
        className="text-[12px] font-semibold uppercase tracking-wide text-muted"
      >
        {title}
      </h2>
      {right}
    </div>
  );
}

type BadgeTone = "success" | "muted" | "info" | "warning";

function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  const map: Record<BadgeTone, string> = {
    success: "bg-success-muted text-success-muted-fg",
    info: "bg-info-muted text-info-muted-fg",
    warning: "bg-warning-muted text-warning-muted-fg",
    muted: "bg-surface-3 text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function FormatProgressBar() {
  return (
    <div
      role="progressbar"
      aria-label="Formatting"
      aria-valuetext="Formatting in progress"
      className="relative h-[2px] w-full overflow-hidden bg-accent-muted"
    >
      <span className="animate-indeterminate absolute inset-y-0 left-0 w-1/3 bg-accent" />
    </div>
  );
}

function EmptyOutput() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-muted">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 8L3 12L7 16M17 8L21 12L17 16M14 4L10 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <p className="text-[13px] text-muted">Click Format Code to see the result</p>
      <p className="flex items-center gap-1.5 text-[12px] text-subtle">
        <Kbd>⌘</Kbd>
        <Kbd>Enter</Kbd>
        <span>to format</span>
      </p>
    </div>
  );
}

interface StatusBarProps {
  type: FormatTypeValue;
  presetLabel: string;
  inputLines: number;
  outputLines: number;
  inputChars: number;
  outputChars: number;
  meta: BytesMeta | null;
  loading: boolean;
}

function StatusBar({
  type,
  presetLabel,
  inputLines,
  outputLines,
  inputChars,
  outputChars,
  meta,
  loading,
}: StatusBarProps) {
  return (
    <footer
      className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-surface-1 px-4 font-mono text-[11px] text-muted"
      role="contentinfo"
    >
      <span className="inline-flex items-center gap-1.5 text-text">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        {type.toUpperCase()}
      </span>
      <span className="hidden sm:inline">Preset: {presetLabel}</span>
      <span className="hidden md:inline">
        In {inputLines}L / {inputChars}C
      </span>
      <span className="hidden md:inline">
        Out {outputLines}L / {outputChars}C
      </span>

      <span className="ml-auto inline-flex items-center gap-3">
        {meta && (
          <span className="hidden lg:inline">
            {formatBytes(meta.bytes_in)} → {formatBytes(meta.bytes_out)}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 ${loading ? "text-warning" : "text-success"}`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${loading ? "bg-warning" : "bg-success"}`}
            aria-hidden="true"
          />
          {loading ? "Formatting…" : "Ready"}
        </span>
      </span>
    </footer>
  );
}
