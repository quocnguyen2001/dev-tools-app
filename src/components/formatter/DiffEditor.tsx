"use client";

import dynamic from "next/dynamic";
import type { EditorTheme } from "@/types/formatter";
import { ensureMonacoLoader } from "@/lib/monaco-loader";

ensureMonacoLoader();

function DiffSkeleton() {
  return (
    <div className="grid h-full grid-cols-2 gap-2 p-4" aria-busy="true" aria-label="Loading diff editor">
      {[0, 1].map((col) => (
        <div key={col} className="flex flex-col gap-2">
          <div className="animate-shimmer h-3 w-1/2 rounded-sm" />
          <div className="animate-shimmer h-3 w-2/3 rounded-sm" />
          <div className="animate-shimmer h-3 w-1/3 rounded-sm" />
          <div className="animate-shimmer h-3 w-3/5 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => <DiffSkeleton />,
  },
);

interface DiffEditorProps {
  original: string;
  modified: string;
  language: string;
  theme: EditorTheme;
  height?: string | number;
}

export function DiffEditor({
  original,
  modified,
  language,
  theme,
  height = "100%",
}: DiffEditorProps) {
  return (
    <MonacoDiffEditor
      original={original}
      modified={modified}
      language={language}
      theme={theme}
      height={height}
      options={{
        readOnly: true,
        renderSideBySide: true,
        automaticLayout: true,
        fontSize: 13,
        fontFamily:
          'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Code", monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
}
