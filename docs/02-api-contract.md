# API Contract (v1)

All endpoints live under `/api/v1/*` on the Laravel backend. The Next.js app
proxies them through a rewrite (`next.config.ts`) so the browser sees them on
the same origin.

## Conventions

- All responses are JSON with `Content-Type: application/json`.
- Success envelope:

  ```ts
  type ApiSuccess<TData, TMeta = Record<string, unknown>> = {
    data: TData;
    meta?: TMeta;
  };
  ```

- Error envelope (any non-2xx status):

  ```ts
  type ApiError = {
    error: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
  };
  ```

## Authentication

Every request must include the header:

```
X-API-KEY: <your key>
```

The key is read from `process.env.NEXT_PUBLIC_API_KEY` and added by
`src/lib/api/client.ts`. Treat the current value as a development convenience
only — see `docs/05-env-and-config.md` for the recommended hardening.

## Endpoints

### `GET /api/v1/types`

Returns the list of supported format types.

**Response 200**

```json
{
  "data": [
    { "value": "json",       "label": "JSON",       "icon": "code" },
    { "value": "html",       "label": "HTML" },
    { "value": "css",        "label": "CSS" },
    { "value": "javascript", "label": "JavaScript" },
    { "value": "sql",        "label": "SQL" }
  ]
}
```

**TypeScript**

```ts
type FormatType = {
  value: "json" | "html" | "css" | "javascript" | "sql";
  label: string;
  icon?: string;
};
```

### `GET /api/v1/types/{type}/presets`

Returns the presets available for a given type. Returns `404` if the type is
unknown.

**Response 200**

```json
{
  "data": [
    { "value": "default",  "label": "Default" },
    { "value": "prettier", "label": "Prettier", "description": "Opinionated code formatter" }
  ]
}
```

**Response 404**

```json
{ "error": { "code": "not_found", "message": "Unknown type: foo" } }
```

**TypeScript**

```ts
type Preset = {
  value: string;
  label: string;
  description?: string;
};
```

### `POST /api/v1/format`

Formats a snippet of code.

**Request body**

```json
{
  "code": "{\"a\":1}",
  "type": "json",
  "preset": "default",
  "prettier_options": {
    "printWidth": 80,
    "tabWidth": 2,
    "useTabs": false,
    "semi": true,
    "singleQuote": false,
    "trailingComma": "es5",
    "bracketSpacing": true,
    "arrowParens": "always",
    "endOfLine": "lf"
  }
}
```

`prettier_options` is only sent when `preset === "prettier"` and `type` is one
of `javascript`, `html`, `css`.

**Response 200**

```json
{
  "data": {
    "code": "{\n  \"a\": 1\n}",
    "type": "json",
    "preset": "default"
  },
  "meta": {
    "bytes_in": 7,
    "bytes_out": 13
  }
}
```

**Response 422 (validation / format failure)**

```json
{
  "error": {
    "code": "format_failed",
    "message": "Unexpected token } in JSON at position 5",
    "details": { "line": 1, "column": 6 }
  }
}
```

## Client helpers

```ts
import { getTypes, getPresets, formatCode } from "@/lib/api/formatter";

const types   = await getTypes();
const presets = await getPresets("json");
const result  = await formatCode({
  code: '{"a":1}',
  type: "json",
  preset: "default",
});
// result.data.code, result.meta.bytes_in / bytes_out
```

All three throw `ApiError` (from `@/lib/api/errors`) on non-2xx responses.
