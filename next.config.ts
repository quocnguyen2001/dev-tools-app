import type { NextConfig } from "next";

/**
 * Tauri requires a fully static frontend bundle. We always emit a static
 * export so the Tauri WebView can load the app from disk.
 *
 * Notes:
 * - `output: "export"` disables Next.js rewrites at runtime, so the app
 *   talks to the Laravel backend through absolute URLs (see
 *   `src/lib/api/client.ts`).
 * - In Tauri, network calls go through `tauri-plugin-http` to bypass
 *   browser CORS restrictions.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
