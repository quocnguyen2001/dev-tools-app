"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

export interface DropdownMenuItem {
  key: string;
  label: ReactNode;
  description?: string;
  icon?: ReactNode;
  onSelect: () => void;
  selected?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
    "aria-haspopup"?: string;
    "aria-expanded"?: boolean;
    id?: string;
  }>;
  items: ReadonlyArray<DropdownMenuItem>;
  align?: "start" | "end";
  ariaLabel?: string;
  width?: number;
}

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  ariaLabel,
  width = 200,
}: DropdownMenuProps) {
  const id = useId();
  const triggerId = `dm-trigger-${id}`;
  const menuId = `dm-menu-${id}`;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [wasOpen, setWasOpen] = useState(false);

  // Reset highlight when transitioning from closed → open. Done during render
  // to avoid the setState-in-effect rule.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const idx = items.findIndex((it) => !it.disabled);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) close();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      itemRefs.current.get(highlight)?.focus();
    });
  }, [highlight, open]);

  const move = (dir: 1 | -1) => {
    if (items.length === 0) return;
    let next = highlight;
    for (let i = 0; i < items.length; i++) {
      next = (next + dir + items.length) % items.length;
      if (!items[next]?.disabled) break;
    }
    setHighlight(next);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const item = items[highlight];
      if (item && !item.disabled) {
        item.onSelect();
        close();
      }
    } else if (e.key === "Tab") {
      close();
    }
  };

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        id: triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          setOpen((o) => !o);
        },
      })
    : trigger;

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {triggerEl}
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          aria-labelledby={triggerId}
          onKeyDown={handleKey}
          style={{ width }}
          className={[
            "animate-popover-in absolute top-full z-40 mt-1 rounded-md border border-border bg-surface-2 p-1 shadow-[var(--shadow-md)]",
            align === "end" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {items.map((item, idx) => (
            <button
              key={item.key}
              ref={(el) => {
                if (el) itemRefs.current.set(idx, el);
                else itemRefs.current.delete(idx);
              }}
              type="button"
              role="menuitem"
              tabIndex={highlight === idx ? 0 : -1}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                close();
              }}
              onMouseEnter={() => !item.disabled && setHighlight(idx)}
              onFocus={() => setHighlight(idx)}
              className={[
                "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors duration-100",
                "focus:outline-none",
                item.disabled && "cursor-not-allowed opacity-50",
                !item.disabled && highlight === idx
                  ? "bg-accent text-accent-fg"
                  : "text-text",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.icon && <span className="mt-0.5 shrink-0">{item.icon}</span>}
              <span className="flex flex-1 flex-col">
                <span className="font-medium">{item.label}</span>
                {item.description && (
                  <span
                    className={[
                      "text-[11px]",
                      highlight === idx ? "text-accent-fg/80" : "text-subtle",
                    ].join(" ")}
                  >
                    {item.description}
                  </span>
                )}
              </span>
              {item.selected && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
