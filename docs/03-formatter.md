# Formatter

The Formatter route (`/`) is a parity port of the legacy Vue page
(`resources/js/pages/Formatter/Index.vue`) onto Next.js + React.

## Parity matrix vs the Vue version

| Behavior                                                  | Vue | Next |
| --------------------------------------------------------- | --- | ---- |
| Default type = `types[0].value`                           | y   | y    |
| Default preset = `initialPresets[0].value`                | y   | y    |
| Sample code seeded into the input on load                 | y   | y    |
| Changing type re-fetches presets, resets preset           | y   | y    |
| Changing type swaps the sample code in the input          | y   | y    |
| Changing type clears the output and exits diff view       | y   | y    |
| Prettier options form only for preset=prettier + js/html/css | y | y    |
| Format button: loading state, disabled while empty/loading | y  | y    |
| Format toast: success bytes_in/out, error message         | y   | y    |
| Copy button: clipboard write + toast                      | y   | y    |
| Clear button: empties input/output, hides diff            | y   | y    |
| View modes: Single / Split / Diff                         | y\* | y    |
| Theme toggle (vs / vs-dark)                               | y   | y    |
| Initial theme from `prefers-color-scheme`                 | y\* | y    |
| Debounced (150ms) diff sync                               | y   | y    |
| Toasts auto-dismiss after 3s                              | y   | y    |
| Toast manual close button                                 | n   | y    |
| Cleanup of Monaco resources on unmount                    | y   | y\*\* |

\* The Vue version exposed only "Show Diff" toggle. The Next port adds an
explicit Single/Split/Diff tab control while keeping the same end result.
\*\* Monaco wrappers use `@monaco-editor/react`, which manages disposal
internally on unmount. We do not retain manual editor instances.

## State machine

`FormatterPage.tsx` keeps the following client state:

- `type`, `prevType` — the active format type. `prevType` is used to react to
  changes during render (see Notes on effects below).
- `preset`, `presets` — the selected preset and the list returned by the API.
- `input`, `output` — editor contents.
- `viewMode` — `"single" | "split" | "diff"`.
- `theme` — `"vs" | "vs-dark"`.
- `loading` — true while `formatCode` is in flight.
- `prettierOpts` — the current Prettier options (only sent when applicable).
- `debouncedInput`, `debouncedOutput` — values fed to the diff editor after a
  150ms debounce, to avoid re-rendering Monaco on every keystroke.

## Notes on effects (Next.js 16 / React 19)

This Next.js version enforces `react-hooks/set-state-in-effect`: you cannot
synchronously call `setState` inside a `useEffect` body. Two common patterns
are used to comply:

- **Derive in render**: when `type` changes, we reset sample code, output, and
  view mode by comparing `type` with `prevType` during render and calling
  `setState` from there.
- **setState in async callbacks**: when fetching presets, the `setState`
  happens inside the awaited callback (allowed), not at the top of the effect.

## API integration

- `getTypes()` and `getPresets(initialType)` run once on the server at
  `src/app/page.tsx`.
- `getPresets(type)` runs on the client whenever `type` changes (with an
  `AbortController` to cancel in-flight requests on rapid changes).
- `formatCode(payload)` runs on click. The payload only includes
  `prettier_options` when `preset === "prettier"` and the type is js/html/css.

## Error handling

All API helpers throw `ApiError` (`src/lib/api/errors.ts`) on non-2xx
responses. The orchestrator catches them and surfaces the message via the
toast system. Server-side fetch failures during initial render fall back to a
hard-coded list of types/presets so the UI remains functional, and an error
toast is pushed once on hydration.
