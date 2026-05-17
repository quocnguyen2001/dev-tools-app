"use client";

import dynamic from "next/dynamic";
import type { EditorTheme } from "@/types/formatter";
import { ensureMonacoLoader } from "@/lib/monaco-loader";

ensureMonacoLoader();

function EditorSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 p-4" aria-busy="true" aria-label="Loading editor">
      <div className="animate-shimmer h-3 w-1/3 rounded-sm" />
      <div className="animate-shimmer h-3 w-1/2 rounded-sm" />
      <div className="animate-shimmer h-3 w-2/5 rounded-sm" />
      <div className="animate-shimmer h-3 w-3/5 rounded-sm" />
      <div className="animate-shimmer h-3 w-1/4 rounded-sm" />
      <div className="animate-shimmer h-3 w-2/3 rounded-sm" />
      <div className="animate-shimmer h-3 w-1/2 rounded-sm" />
    </div>
  );
}

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

interface MonacoEditorProps {
  value: string;
  language: string;
  theme: EditorTheme;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string | number;
}

export function CodeEditor({
  value,
  language,
  theme,
  onChange,
  readOnly = false,
  height = "100%",
}: MonacoEditorProps) {
  return (
    <MonacoEditor
      value={value}
      language={language}
      theme={theme}
      height={height}
      onChange={(next) => onChange?.(next ?? "")}
      options={{
        readOnly,
        automaticLayout: true,
        fontSize: 13,
        fontFamily:
          'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Code", monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 4,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        renderLineHighlight: "line",
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
}
