"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import type {
  FormatType,
  FormatTypeValue,
  Preset,
  ViewMode,
} from "@/types/formatter";

interface FormatterToolbarProps {
  types: FormatType[];
  selectedType: FormatTypeValue;
  onTypeChange: (next: FormatTypeValue) => void;

  presets: Preset[];
  selectedPreset: string;
  onPresetChange: (next: string) => void;

  viewMode: ViewMode;
  onViewModeChange: (next: ViewMode) => void;

  loading: boolean;
  inputEmpty: boolean;
  outputEmpty: boolean;
  onFormat: () => void;
  onCopy: () => void;
  onClear: () => void;

  languageTriggerRef: RefObject<HTMLButtonElement | null>;
}

const VIEW_MODES = [
  {
    value: "single" as const,
    label: "Single",
    iconOnlyOnMobile: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "split" as const,
    label: "Split",
    iconOnlyOnMobile: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M12 4V20" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "diff" as const,
    label: "Diff",
    iconOnlyOnMobile: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4V20M8 8L4 12L8 16M16 8L20 12L16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const FormatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 8L3 12L7 16M17 8L21 12L17 16M14 4L10 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
    <path
      d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export function FormatterToolbar({
  types,
  selectedType,
  onTypeChange,
  presets,
  selectedPreset,
  onPresetChange,
  viewMode,
  onViewModeChange,
  loading,
  inputEmpty,
  outputEmpty,
  onFormat,
  onCopy,
  onClear,
  languageTriggerRef,
}: FormatterToolbarProps) {
  const typeOptions = types.map((t) => ({ value: t.value, label: t.label }));
  const presetOptions = presets.map((p) => ({
    value: p.value,
    label: p.label,
    description: p.description,
  }));

  return (
    <div className="border-b border-border bg-surface-1">
      {/* Row 1: language / standard / view mode */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <Select<FormatTypeValue>
          ref={languageTriggerRef}
          label="Language"
          value={selectedType}
          onChange={onTypeChange}
          options={typeOptions}
          triggerClassName="min-w-[140px]"
        />

        <Select
          label="Standard"
          value={selectedPreset}
          onChange={onPresetChange}
          options={presetOptions}
          triggerClassName="min-w-[160px]"
        />

        <div className="ml-auto">
          <Tabs<ViewMode>
            ariaLabel="View mode"
            items={VIEW_MODES}
            value={viewMode}
            onChange={onViewModeChange}
          />
        </div>
      </div>

      {/* Row 2: actions + shortcut hint */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2">
        <Button
          variant="primary"
          size="md"
          loading={loading}
          disabled={inputEmpty}
          onClick={onFormat}
          leftIcon={<FormatIcon />}
        >
          {loading ? "Formatting…" : "Format Code"}
        </Button>

        <Button
          variant="secondary"
          size="md"
          disabled={outputEmpty}
          onClick={onCopy}
          leftIcon={<CopyIcon />}
        >
          Copy
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={onClear}
          leftIcon={<ClearIcon />}
        >
          Clear
        </Button>

        <span className="ml-auto hidden items-center gap-1.5 text-[12px] text-subtle md:flex">
          <Kbd>⌘</Kbd>
          <Kbd>Enter</Kbd>
          <span>to format</span>
        </span>
      </div>
    </div>
  );
}
