# Environment & Configuration

## Required env vars

Copy `.env.local.example` to `.env.local` and fill in real values:

| Variable                   | Purpose                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Laravel backend (e.g. `http://localhost:8000`). Used by the rewrite and by SSR. |
| `NEXT_PUBLIC_API_KEY`      | Value sent in the `X-API-KEY` header for every request.                                         |

`NEXT_PUBLIC_*` variables are inlined into the client bundle at build time, so
both the browser and the Node.js runtime can read them.

## Security note on `NEXT_PUBLIC_API_KEY`

`NEXT_PUBLIC_*` is a deliberate Next.js convention: anything that prefix is
shipped to the browser. The current setup is fine for local development but
**never put a production-grade secret in `NEXT_PUBLIC_API_KEY`**. For
production, the recommended pattern is:

1. Add a server-only env var, e.g. `API_KEY=...` (no `NEXT_PUBLIC_` prefix).
2. Move the API call to a Next.js Route Handler / Server Action / proxy.
3. The browser hits your Next.js endpoint, which attaches the secret server
   side and forwards to Laravel.

That way the secret never reaches the client bundle.

## Rewrites

`next.config.ts` defines a single rewrite:

```ts
{
  source: "/api/v1/:path*",
  destination: "${NEXT_PUBLIC_API_BASE_URL}/api/v1/:path*",
}
```

Important: rewrites only run for browser-originated requests. Server
Components (`src/app/page.tsx`) bypass them and must call the absolute backend
URL directly. `apiFetch` in `src/lib/api/client.ts` handles both cases:

- In the browser it builds a relative URL (`/api/v1/...`) so the rewrite
  applies.
- On the server it falls back to `process.env.NEXT_PUBLIC_API_BASE_URL`.

## TypeScript paths

`tsconfig.json` maps `@/*` to `./src/*`. Always import via `@/...` rather than
deep relative paths.

## Tailwind v4

Tailwind v4 is configured via `@import "tailwindcss"` in
`src/app/globals.css`. Theme variables are declared via `@theme inline { ... }`
in the same file. Add new design tokens there rather than scattering custom
CSS.

## Scripts

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `npm run dev`   | Starts the Turbopack dev server.                      |
| `npm run build` | Production build (used by CI / before deploying).     |
| `npm run start` | Serves the production build.                          |
| `npm run lint`  | Runs ESLint with the Next.js + TypeScript presets.    |
