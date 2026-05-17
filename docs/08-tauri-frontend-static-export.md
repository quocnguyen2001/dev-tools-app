# Frontend — chuyển sang static export cho Tauri

Tauri load UI từ một thư mục HTML/JS/CSS tĩnh. Trong WKWebView không
có Next.js server, nên `next build` phải sinh ra một bundle hoàn toàn
self-contained (`out/`).

Tài liệu này giải thích chi tiết từng thay đổi đã được áp dụng vào
codebase và lý do vì sao.

## 1. `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

| Trường | Ý nghĩa |
|---|---|
| `output: "export"` | Yêu cầu Next.js sinh static bundle vào `out/` thay vì chạy server runtime |
| `images.unoptimized: true` | Tắt image optimization server (vì không có Next.js runtime) |

### Đã loại bỏ block `rewrites`

Phiên bản trước có:

```ts
async rewrites() {
  return [
    { source: "/api/v1/:path*", destination: `${apiBase}/api/v1/:path*` },
  ];
}
```

Static export **không chạy** rewrites tại runtime, nên block này không
còn ý nghĩa. App giờ luôn gọi backend bằng absolute URL
(`NEXT_PUBLIC_API_BASE_URL`).

## 2. `src/app/page.tsx`

Trước:

```tsx
export const dynamic = "force-dynamic";

export default async function Home() {
  const types = await getTypes();
  const presets = await getPresets(types[0].value);
  return <FormatterPage initialTypes={types} initialPresets={presets} ... />;
}
```

Sau:

```tsx
const FALLBACK_TYPES: FormatType[] = [
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "sql", label: "SQL" },
];

const FALLBACK_PRESETS: Preset[] = [{ value: "default", label: "Default" }];

export default function Home() {
  return (
    <FormatterPage
      initialTypes={FALLBACK_TYPES}
      initialType={FALLBACK_TYPES[0].value}
      initialPresets={FALLBACK_PRESETS}
    />
  );
}
```

### Vì sao bỏ server-side fetch

- Static export render Server Component **một lần ở build-time**.
  Backend Laravel có thể không tồn tại tại thời điểm build → fetch sẽ
  fail và toàn bộ build vỡ.
- Hard-code fallback giúp build deterministic, không phụ thuộc
  network.
- `FormatterPage` đã có sẵn `useEffect` gọi `getPresets(type)` khi
  mount — user thấy fallback xong sẽ thấy data thật ngay.

## 3. `src/lib/api/client.ts`

### Thay đổi 1 — detect Tauri runtime

```ts
function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
```

Tauri inject `__TAURI_INTERNALS__` vào `window` global khi load app.
Đây là signal đáng tin cậy nhất để phân biệt browser vs Tauri.

### Thay đổi 2 — swap fetch implementation

```ts
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
```

- Trong Tauri: dynamic-import `@tauri-apps/plugin-http`. Hàm `fetch`
  của plugin gửi request qua **Rust core** thay vì browser. Bỏ qua
  CORS, nhưng phải khớp scope trong `capabilities/default.json`.
- Trong browser: dùng `fetch` native.
- Cache để chỉ import 1 lần.

### Thay đổi 3 — luôn dùng absolute URL

```ts
function resolveBaseUrl(override?: string): string {
  if (override) return override.replace(/\/$/, "");
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000")
    .replace(/\/$/, "");
}
```

Trước đây ở client trả về `""` (relative URL, để rewrites xử lý). Giờ
rewrites đã bỏ → cả browser lẫn Tauri đều gọi tới
`http://localhost:8000/api/v1/...`.

### `apiFetch` không thay đổi public contract

`apiFetch<TResponse>(path, init)` vẫn nhận same signature. Chỉ phần
internal detect runtime + chọn fetch là khác.

## 4. Bundle Monaco editor offline (`scripts/copy-monaco.mjs`)

Khi đặt CSP `script-src 'self'` (mặc định Tauri production), trình
duyệt sẽ chặn fetch script từ external origin. `@monaco-editor/react`
mặc định load Monaco từ `https://cdn.jsdelivr.net`, nên trong production
build app sẽ kẹt ở loading skeleton mặc dù dev mode chạy bình thường.

Hai thay đổi đã được áp dụng:

### `scripts/copy-monaco.mjs`

Copy `node_modules/monaco-editor/min/vs` sang `public/monaco-editor/vs`
mỗi lần build. Chạy tự động qua `predev` / `prebuild` hooks trong
`package.json`:

```json
{
  "scripts": {
    "predev": "node scripts/copy-monaco.mjs",
    "dev": "next dev",
    "prebuild": "node scripts/copy-monaco.mjs",
    "build": "next build"
  }
}
```

Bundle Monaco nằm ở `public/` nên Next.js sẽ copy trực tiếp vào `out/`
khi build static export.

> `public/monaco-editor/` được ignore trong `.gitignore` — luôn
> regenerate từ npm install + script.

### `src/lib/monaco-loader.ts`

```ts
import { loader } from "@monaco-editor/react";

let configured = false;

export function ensureMonacoLoader(): void {
  if (configured) return;
  configured = true;
  loader.config({ paths: { vs: "/monaco-editor/vs" } });
}
```

Hai wrapper `MonacoEditor.tsx` và `DiffEditor.tsx` gọi
`ensureMonacoLoader()` ở module scope (chạy 1 lần khi module load).
Loader sẽ đọc từ bundle local thay vì jsdelivr CDN.

## 5. Hệ quả về CORS

| Mode | CORS phía Laravel? |
|---|---|
| Tauri build (`tauri:dev`, `tauri:build`) | **Không cần** — request đi từ Rust |
| Next.js dev (`npm run dev`) trong browser | **Cần** — origin `http://localhost:3000` |
| Next.js production (`npm start`) trong browser | **Cần** — origin tương ứng |

Nếu bạn chỉ dùng app desktop (Tauri), không cần đụng CORS Laravel.
Nếu vẫn dùng browser mode để debug, bật CORS allow origin
`http://localhost:3000` trong Laravel.

## 6. Verify static bundle

```bash
npm run build
ls out/index.html        # phải tồn tại
ls out/_next/static/     # phải có thư mục hash + chunks
```

`next build` phải in dòng `Generating static pages (X/X)` → done.
Output mẫu:

```
Route (app)                    Size  First Load JS
┌ ○ /                       4.13 kB         180 kB
└ ○ /_not-found              990 B          103 kB
○  (Static)  prerendered as static content
```

Cả 2 routes phải là `○ Static`. Nếu xuất hiện `λ Server` hoặc
`ƒ Dynamic`, có nghĩa code còn dùng API server-only (cookies, headers,
fetch with no-store...) → cần refactor.

## 7. Chuyện gì xảy ra nếu thêm route mới

Khi thêm tool mới (theo `04-adding-new-tool.md`), nhớ:

- **KHÔNG** dùng `dynamic = "force-dynamic"`.
- **KHÔNG** gọi API ở Server Component (sẽ chạy lúc build).
- **NÊN** seed bằng fallback và để client component refresh.
- Nếu cần dynamic route, cấu hình `generateStaticParams` để
  pre-generate đủ tham số tại build-time.

## 8. Tóm tắt

| File | Thay đổi |
|---|---|
| `next.config.ts` | Thêm `output: "export"`, `images.unoptimized`; bỏ rewrites |
| `src/app/page.tsx` | Bỏ `force-dynamic` + server fetch; dùng fallback |
| `src/lib/api/client.ts` | Detect Tauri, swap fetch, luôn absolute URL |
| `scripts/copy-monaco.mjs` (mới) | Copy Monaco bundle vào `public/` trước mỗi build |
| `src/lib/monaco-loader.ts` (mới) | Trỏ Monaco AMD loader về bundle local |
| `src/components/formatter/MonacoEditor.tsx` | Gọi `ensureMonacoLoader()` |
| `src/components/formatter/DiffEditor.tsx` | Gọi `ensureMonacoLoader()` |

Sang [`09-tauri-config-and-capabilities.md`](./09-tauri-config-and-capabilities.md) để hiểu cấu hình Tauri.
