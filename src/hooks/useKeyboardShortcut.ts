"use client";

import { useEffect } from "react";

export interface KeyboardShortcut {
  /**
   * Key string. Modifiers in any order, lowercase, separated by `+`.
   * Examples: "mod+enter", "mod+shift+c", "?", "escape".
   * "mod" matches Meta (⌘) on macOS, Ctrl on other platforms.
   */
  combo: string;
  handler: (event: KeyboardEvent) => void;
  /**
   * If true, the shortcut still fires while focus is inside an editable
   * element (input, textarea, contenteditable, Monaco, etc.). Default: false.
   */
  allowInEditor?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // Monaco renders a hidden textarea wrapped in `.monaco-editor`.
  if (target.closest(".monaco-editor")) return true;
  return false;
}

function matches(combo: string, event: KeyboardEvent): boolean {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const key = parts.pop() ?? "";
  const wantMod = parts.includes("mod");
  const wantShift = parts.includes("shift");
  const wantAlt = parts.includes("alt");
  const wantCtrl = parts.includes("ctrl");

  const isMac =
    typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform);
  const modPressed = isMac ? event.metaKey : event.ctrlKey;

  if (wantMod !== modPressed) return false;
  if (wantShift !== event.shiftKey) return false;
  if (wantAlt !== event.altKey) return false;
  if (wantCtrl && !event.ctrlKey) return false;

  const eventKey = event.key.toLowerCase();
  if (key === "space") return eventKey === " ";
  return eventKey === key;
}

export function useKeyboardShortcut(shortcuts: ReadonlyArray<KeyboardShortcut>) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      for (const sc of shortcuts) {
        if (!matches(sc.combo, event)) continue;
        if (!sc.allowInEditor && isEditableTarget(event.target)) continue;
        event.preventDefault();
        sc.handler(event);
        break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
