# Adding a New Tool

This codebase is structured so new tools (URL encoder, JWT decoder, regex
tester, etc.) can be added without touching the Formatter.

## 1. Define types

Create or extend `src/types/<tool>.ts` with:

- the request/response shapes mirroring your backend endpoint;
- any UI-only types (view modes, options forms).

Re-use `ApiSuccess<T, TMeta>` from `src/types/api.ts` instead of inventing a
new envelope.

## 2. Add API helpers

Create `src/lib/api/<tool>.ts` and use `apiFetch<T>` from `src/lib/api/client`.
The client already adds `X-API-KEY` and the JSON content type — do not write a
new fetch wrapper.

```ts
import { apiFetch } from "@/lib/api/client";
import type { ApiSuccess } from "@/types/api";
import type { MyToolResult } from "@/types/mytool";

export function runMyTool(input: string) {
  return apiFetch<ApiSuccess<MyToolResult>>("/api/v1/mytool", {
    method: "POST",
    body: { input },
  });
}
```

## 3. Build the UI

Place components under `src/components/<tool>/`:

- A top-level orchestrator marked `"use client"`.
- Smaller presentational components (toolbar, action bar, input/output panels).

Re-use the shared primitives:

- `useToast` + `<ToastViewport>` for notifications.
- `useCopyToClipboard` for clipboard interactions.
- `useDebouncedEffect` for any debounced-effect work.
- `MonacoEditor` / `DiffEditor` if the tool needs a code editor.

Keep components small (< ~300 LOC). Split when they grow.

## 4. Wire up a route

Create `src/app/<tool>/page.tsx`. Match the Formatter pattern:

- The page itself is a Server Component.
- It performs any required initial fetches via `apiFetch` (server-side), with
  `cache: "no-store"` if the data is volatile.
- It renders the client orchestrator with hydrated initial props.

```tsx
// src/app/mytool/page.tsx
import { MyToolPage } from "@/components/mytool/MyToolPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  // optional: initial fetch with try/catch and a fallback
  return <MyToolPage />;
}
```

## 5. Optional: add navigation

The current scaffold has no global nav; add one in `src/app/layout.tsx` (or a
new layout group) when you have more than one tool.

## Checklist before merging

- `npm run lint` is clean.
- `npm run build` succeeds.
- All client effects clean up timers/listeners.
- No `any` introduced (justify in a comment if absolutely required).
- Named exports for components; default exports only for Next.js framework
  files.
- Toasts/error paths covered for the unhappy cases.
