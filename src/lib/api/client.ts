import type { ApiErrorPayload } from "@/types/api";
import { ApiError } from "./errors";

interface ApiFetchInit extends Omit<RequestInit, "body"> {
  body?: unknown;
  /**
   * Override base URL. Useful for tests or environments where the resolved
   * default does not apply.
   */
  baseUrl?: string;
}

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

let cachedFetch: FetchFn | null = null;

/**
 * Detect whether the page is running inside a Tauri WebView.
 *
 * Tauri injects `__TAURI_INTERNALS__` into the global scope when the app
 * is loaded as a desktop bundle. We use that signal to swap the network
 * implementation: in Tauri we go through `@tauri-apps/plugin-http` so
 * requests are issued by the Rust core (no browser CORS), and elsewhere
 * we use the platform `fetch`.
 */
function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function resolveFetch(): Promise<FetchFn> {
  if (cachedFetch) return cachedFetch;
  if (isTauriRuntime()) {
    const mod = await import("@tauri-apps/plugin-http");
    cachedFetch = mod.fetch as FetchFn;
  } else {
    cachedFetch = globalThis.fetch.bind(globalThis);
  }
  return cachedFetch;
}

/**
 * Resolve the base URL used to build request URLs.
 *
 * The app is bundled as a static export (see `next.config.ts`), so
 * Next.js rewrites are not available at runtime. Both the browser build
 * and the Tauri build call the backend through an absolute URL.
 */
function resolveBaseUrl(override?: string): string {
  if (override) return override.replace(/\/$/, "");
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
}

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY ?? "";
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = (value as { error?: unknown }).error;
  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      typeof (candidate as { code?: unknown }).code === "string" &&
      typeof (candidate as { message?: unknown }).message === "string",
  );
}

export async function apiFetch<TResponse>(
  path: string,
  init: ApiFetchInit = {},
): Promise<TResponse> {
  const { body, headers, baseUrl, ...rest } = init;
  const url = `${resolveBaseUrl(baseUrl)}${path}`;

  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  finalHeaders.set("X-API-KEY", getApiKey());
  if (body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const fetchFn = await resolveFetch();

  let response: Response;
  try {
    response = await fetchFn(url, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError({
      code: "network_error",
      message: cause instanceof Error ? cause.message : "Network request failed",
      status: 0,
    });
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Non-JSON response. Leave parsed = null and rely on status handling.
    }
  }

  if (!response.ok) {
    if (isApiErrorPayload(parsed)) {
      throw new ApiError({
        code: parsed.error.code,
        message: parsed.error.message,
        status: response.status,
        details: parsed.error.details,
      });
    }
    throw new ApiError({
      code: `http_${response.status}`,
      message: response.statusText || `Request failed with status ${response.status}`,
      status: response.status,
    });
  }

  return parsed as TResponse;
}
