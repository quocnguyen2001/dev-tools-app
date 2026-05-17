"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectProps<T extends string = string> {
  value: T;
  onChange: (next: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  label?: string;
  placeholder?: string;
  id?: string;
  triggerClassName?: string;
  size?: "sm" | "md";
}

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function SelectInner<T extends string = string>(
  {
    value,
    onChange,
    options,
    label,
    placeholder = "Select…",
    id,
    triggerClassName = "",
    size = "md",
  }: SelectProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId}`;
  const listboxId = `${triggerId}-list`;

  const internalRef = useRef<HTMLButtonElement | null>(null);
  // Forward our internal ref to the parent.
  useImperativeHandle(ref, () => internalRef.current as HTMLButtonElement, []);

  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const initialIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(initialIdx);
  const [lastSyncValue, setLastSyncValue] = useState<T>(value);

  // Sync highlight when value changes externally — done during render to
  // avoid setState-in-effect rule.
  if (!open && value !== lastSyncValue) {
    const idx = options.findIndex((o) => o.value === value);
    setLastSyncValue(value);
    setHighlight(idx >= 0 ? idx : 0);
  }

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => internalRef.current?.focus());
  }, []);

  // Click outside.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (internalRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus listbox + scroll highlighted item into view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current.get(highlight)?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const handleTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + options.length) % options.length);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setHighlight(options.length - 1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) {
        onChange(opt.value);
        close();
      }
    }
  };

  const heightClass = size === "sm" ? "h-8 text-[13px]" : "h-9 text-sm";

  return (
    <div className="flex items-center gap-2">
      {label && (
        <label
          htmlFor={triggerId}
          className="text-[11px] font-medium uppercase tracking-wide text-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={internalRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleTriggerKey}
          className={[
            "inline-flex items-center justify-between gap-2 rounded-md border border-border bg-surface-1 px-3 text-text",
            "hover:border-border-strong hover:bg-surface-2",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
            "transition-colors duration-150 ease-out",
            heightClass,
            triggerClassName,
          ].join(" ")}
        >
          <span className={selected ? "truncate" : "truncate text-subtle"}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="text-muted">
            <ChevronIcon />
          </span>
        </button>

        {open && (
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={triggerId}
            tabIndex={-1}
            onKeyDown={handleListKey}
            className="animate-popover-in absolute left-0 right-0 top-full z-30 mt-1 max-h-72 min-w-[180px] overflow-y-auto rounded-md border border-border bg-surface-2 p-1 shadow-[var(--shadow-md)] focus:outline-none"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlight;
              return (
                <div
                  key={opt.value}
                  ref={(el) => {
                    if (el) itemRefs.current.set(idx, el);
                    else itemRefs.current.delete(idx);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => {
                    onChange(opt.value);
                    close();
                  }}
                  className={[
                    "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-[13px] transition-colors duration-100",
                    isHighlighted ? "bg-accent text-accent-fg" : "text-text",
                  ].join(" ")}
                >
                  <span className="mt-0.5 w-3.5 shrink-0">
                    {isSelected && <CheckIcon />}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium">{opt.label}</span>
                    {opt.description && (
                      <span
                        className={[
                          "text-[11px]",
                          isHighlighted ? "text-accent-fg/80" : "text-subtle",
                        ].join(" ")}
                      >
                        {opt.description}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// forwardRef preserves the generic via an explicit cast.
export const Select = forwardRef(SelectInner) as <T extends string = string>(
  props: SelectProps<T> & { ref?: React.ForwardedRef<HTMLButtonElement> },
) => ReturnType<typeof SelectInner>;
