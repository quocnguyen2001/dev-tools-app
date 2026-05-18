import type { ApiSuccess } from "@/types/api";
import type {
  FormatRequest,
  FormatResponseData,
  FormatResponseMeta,
  FormatType,
  FormatTypeValue,
  Preset,
} from "@/types/formatter";
import { apiFetch } from "./client";

const TYPES_CACHE_TTL_MS = 5 * 60 * 1000;

let typesCache: { data: FormatType[]; expiresAt: number } | null = null;
let typesInflight: Promise<FormatType[]> | null = null;

interface FetchOptions {
  /** Cache strategy passed through to fetch(). */
  cache?: RequestCache;
  /** Optional base URL override (server components). */
  baseUrl?: string;
  signal?: AbortSignal;
}

export async function getTypes(opts: FetchOptions = {}): Promise<FormatType[]> {
  const res = await apiFetch<ApiSuccess<FormatType[]>>("/api/v1/types", {
    method: "GET",
    cache: opts.cache,
    baseUrl: opts.baseUrl,
    signal: opts.signal,
  });
  return res.data;
}

export async function getTypesCached(
  opts: FetchOptions = {},
): Promise<FormatType[]> {
  if (typesCache && Date.now() < typesCache.expiresAt) {
    return typesCache.data;
  }

  if (typesInflight) {
    return typesInflight;
  }

  typesInflight = (async () => {
    try {
      const fresh = await getTypes(opts);
      typesCache = {
        data: fresh,
        expiresAt: Date.now() + TYPES_CACHE_TTL_MS,
      };
      return fresh;
    } finally {
      typesInflight = null;
    }
  })();

  return typesInflight;
}

export function invalidateTypesCache(): void {
  typesCache = null;
}

export async function getPresets(
  type: FormatTypeValue,
  opts: FetchOptions = {},
): Promise<Preset[]> {
  const res = await apiFetch<ApiSuccess<Preset[]>>(
    `/api/v1/types/${encodeURIComponent(type)}/presets`,
    {
      method: "GET",
      cache: opts.cache,
      baseUrl: opts.baseUrl,
      signal: opts.signal,
    },
  );
  return res.data;
}

export interface FormatResult {
  data: FormatResponseData;
  meta: FormatResponseMeta;
}

export async function formatCode(
  request: FormatRequest,
  opts: FetchOptions = {},
): Promise<FormatResult> {
  const res = await apiFetch<ApiSuccess<FormatResponseData, FormatResponseMeta>>(
    "/api/v1/format",
    {
      method: "POST",
      body: request,
      cache: opts.cache,
      baseUrl: opts.baseUrl,
      signal: opts.signal,
    },
  );
  return {
    data: res.data,
    meta: res.meta ?? { bytes_in: 0, bytes_out: 0 },
  };
}
