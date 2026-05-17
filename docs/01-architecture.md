# Architecture

## Overview

Dev Tools is a Next.js 16 (App Router) + React 19 + TypeScript front-end that
talks to an existing Laravel backend exposing `/api/v1/*`. The UI is a single
page (the Formatter) for now, but the layout is set up to host more tools.

The same code base ships in two flavours:

- **Web** — `npm run dev` / `npm run build` produce a Next.js app that
  runs in a browser.
- **Desktop** — `npm run tauri:build` packages the static export into a
  native macOS app. See [`06-tauri-overview.md`](./06-tauri-overview.md)
  for details.

```
Browser ──► Next.js (App Router)
                │
                ├─ Server Components (RSC)
                │     │
                │     └─ initial fetch ─► Laravel /api/v1/*
                │
                └─ Client Components ───► /api/v1/* (rewritten by Next.js
                                          to NEXT_PUBLIC_API_BASE_URL)
```

## Why server + client split

- The home route `src/app/page.tsx` is a Server Component, but it does
  not perform any server-side fetching. The app ships as a static
  export (so it can be packaged by Tauri), so initial type/preset
  lists come from a hard-coded fallback. `FormatterPage` refreshes
  them on mount.
- The actual editor experience (Monaco, toasts, debounced diff sync) lives in
  `FormatterPage.tsx` which is marked `"use client"`. Monaco does not support
  SSR, so its wrappers (`MonacoEditor.tsx`, `DiffEditor.tsx`) lazy-load via
  `next/dynamic` with `ssr: false`.

## Folder layout

```
src/
  app/
    layout.tsx          Root layout (metadata, fonts, full-height shell)
    page.tsx            Server Component: load initial data, render <FormatterPage>
    error.tsx           Route-level error boundary (Client Component)
    globals.css         Tailwind v4 entry + minimal animations
  components/
    formatter/
      FormatterPage.tsx     Orchestrator (state, effects, layout)
      FormatterToolbar.tsx  Type/preset selects, view-mode tabs, theme toggle
      ActionBar.tsx         Format / Copy / Clear buttons
      MonacoEditor.tsx      Dynamic Monaco Editor wrapper
      DiffEditor.tsx        Dynamic Monaco DiffEditor wrapper
      PrettierOptions.tsx   Conditional Prettier options form
    ui/
      Toast.tsx
      ToastViewport.tsx
  hooks/
    useToast.ts             Toast queue + auto-dismiss
    useDebouncedEffect.ts   Effect with leading-edge debounce
    useCopyToClipboard.ts   navigator.clipboard with execCommand fallback
  lib/
    api/
      client.ts             apiFetch<T>() with X-API-KEY + JSON handling
      errors.ts             ApiError class + isApiError type guard
      formatter.ts          getTypes(), getPresets(), formatCode()
    formatter/
      languages.ts          FormatType -> Monaco language id
      samples.ts            Sample code per type (1:1 with the legacy Vue)
      defaults.ts           DEFAULT_PRETTIER_OPTIONS + isPrettierApplicable()
  types/
    api.ts                  ApiSuccess<T>, ApiErrorPayload
    formatter.ts            FormatType, Preset, PrettierOptions, ViewMode, ...
docs/                       This documentation
.env.local.example          Required env vars (NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_API_KEY)
next.config.ts              `output: "export"` — produces a static bundle in `out/`
src-tauri/                  Tauri (Rust) crate — see docs 06-11
```

## Data flow

1. The user opens the app. The Server Component renders immediately with
   a hard-coded fallback list (no network call at build time).
2. `FormatterPage` (`"use client"`) mounts and seeds local state from
   the fallback. A `useEffect` fires `getPresets(type)` to refresh the
   real list as soon as the API responds.
3. Client interactions (changing type, hitting Format) call `apiFetch`.
   The helper detects the runtime: in a browser it uses native
   `fetch`, inside Tauri it imports `@tauri-apps/plugin-http` and lets
   the Rust core issue the request (no CORS).
4. Errors are surfaced through the in-app toast system rather than throwing.

## Conventions

- Named exports only; default exports are reserved for files Next.js requires
  to default-export (`page.tsx`, `layout.tsx`, `error.tsx`).
- Components stay below ~300 LOC. Anything bigger is split.
- All client side-effects (timers, listeners) clean up in their effect's
  return function.
- TypeScript `strict` is on. `any` is avoided; the only narrow casts happen at
  network parse boundaries (see `client.ts`).
- Styling uses Tailwind v4 utility classes; custom CSS is minimal and limited
  to the toast slide-in animation.
