"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** Hide label on small screens, keep icon. */
  iconOnlyOnMobile?: boolean;
  ariaLabel?: string;
}

interface TabsProps<T extends string> {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  size = "md",
}: TabsProps<T>) {
  const groupId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  const activeIndex = Math.max(
    0,
    items.findIndex((it) => it.value === value),
  );

  // Measure active tab to position the sliding pill.
  useLayoutEffect(() => {
    const el = buttonsRef.current.get(value);
    const list = listRef.current;
    if (!el || !list) return;
    const elRect = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    setIndicator({ x: elRect.left - listRect.left, w: elRect.width });
  }, [value, items]);

  // Re-measure on resize so the pill stays aligned.
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const el = buttonsRef.current.get(value);
      if (!el) return;
      const elRect = el.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      setIndicator({ x: elRect.left - listRect.left, w: elRect.width });
    });
    ro.observe(list);
    return () => ro.disconnect();
  }, [value]);

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = items[(activeIndex + dir + items.length) % items.length];
    onChange(next.value);
    requestAnimationFrame(() => {
      buttonsRef.current.get(next.value)?.focus();
    });
  };

  const heightClass = size === "sm" ? "h-8" : "h-9";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      ref={listRef}
      onKeyDown={handleKey}
      className={`relative inline-flex ${heightClass} items-center rounded-md border border-border bg-surface-2 p-0.5`}
    >
      {indicator && (
        <span
          aria-hidden="true"
          style={{
            transform: `translateX(${indicator.x}px)`,
            width: indicator.w,
          }}
          className="pointer-events-none absolute left-0 top-0.5 bottom-0.5 rounded-[5px] bg-surface-0 shadow-[var(--shadow-sm)] transition-transform duration-200 motion-reduce:transition-none"
        />
      )}
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            ref={(el) => {
              if (el) buttonsRef.current.set(it.value, el);
              else buttonsRef.current.delete(it.value);
            }}
            id={`${groupId}-${it.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-label={it.ariaLabel}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(it.value)}
            className={[
              "relative z-10 inline-flex items-center gap-1.5 rounded-[5px] px-3 text-[13px] font-medium",
              "transition-colors duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-2",
              active ? "text-text" : "text-muted hover:text-text",
              size === "sm" ? "h-7" : "h-8",
            ].join(" ")}
          >
            {it.icon && <span className="shrink-0">{it.icon}</span>}
            <span className={it.iconOnlyOnMobile ? "hidden sm:inline" : ""}>
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
