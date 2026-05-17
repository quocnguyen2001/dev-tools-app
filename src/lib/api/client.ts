import type { ApiErrorPayload } from "@/types/api";
import { ApiError } from "./errors";

interface ApiFetchInit extends Omit<RequestInit, "body"> {
  body?: unknown;
  /**
   * Override base URL. Useful for server components that must call the
   * backend directly (rewrites only apply on the client).
   */
  baseUrl?: string;
}

/**
 * Resolve the base URL used to build request URLs.
 *
 * - On the server we must hit the backend directly because Next.js rewrites
 *   only run for browser-originated requests.
 * - On the client we prefer relative URLs so the browser hits the rewrite
 *   defined in `next.config.ts`.
 */
function resolveBaseUrl(override?: string): string {
  if (override) return override.replace(/\/$/, "");
  if (typeof window === "undefined") {
    return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
  }
  return "";
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

  let response: Response;
  try {
    response = await fetch(url, {
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
