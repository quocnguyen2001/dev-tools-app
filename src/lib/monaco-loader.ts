"use client";

import { loader } from "@monaco-editor/react";

let configured = false;

/**
 * Point the Monaco AMD loader at the bundled assets in `public/monaco-editor/vs`.
 *
 * `@monaco-editor/react` defaults to loading Monaco from
 * https://cdn.jsdelivr.net at runtime. That works in `next dev` (no CSP), but
 * the Tauri production bundle ships with `script-src 'self'`, so the CDN fetch
 * is blocked and the editor stalls on its loading skeleton.
 *
 * `scripts/copy-monaco.mjs` copies `node_modules/monaco-editor/min/vs` into
 * `public/monaco-editor/vs` before each build, and this helper rewires the
 * loader to read from that local path instead.
 */
export function ensureMonacoLoader(): void {
  if (configured) return;
  configured = true;
  loader.config({ paths: { vs: "/monaco-editor/vs" } });
}
