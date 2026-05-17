# Tauri Desktop App — Tổng quan

Tài liệu này mô tả cách Dev Tools được đóng gói thành ứng dụng desktop
macOS bằng Tauri v2. Đọc file này trước để hiểu kiến trúc chung, sau
đó đọc các file 07-11 theo thứ tự.

## 1. Vì sao chọn Tauri

| Tiêu chí | Tauri v2 | Electron |
|---|---|---|
| Bundle size (`.app`) | ~10–20 MB | ~120+ MB |
| Runtime memory | thấp (WKWebView native) | cao (Chromium đính kèm) |
| Backend language | Rust | Node.js |
| HTTP outbound | Rust core, không dính CORS browser | tùy implement |
| macOS Apple Silicon | hỗ trợ first-class | hỗ trợ |

Tauri dùng **WKWebView** sẵn có trong macOS làm UI runtime, nên app
khởi động nhanh và nhẹ. Backend Rust đảm nhiệm I/O hệ thống và HTTP.

## 2. Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    Dev Tools.app (macOS)                    │
│                                                             │
│   ┌────────────────────────┐    ┌────────────────────────┐  │
│   │   WKWebView (UI)       │    │   Rust core            │  │
│   │                        │    │                        │  │
│   │   Next.js static       │◄──►│   tauri runtime        │  │
│   │   export (out/)        │IPC │   + tauri-plugin-http  │  │
│   │                        │    │                        │  │
│   └─────────┬──────────────┘    └────────────┬───────────┘  │
│             │                                │              │
└─────────────┼────────────────────────────────┼──────────────┘
              │                                │
              │ apiFetch — qua plugin-http     │ HTTP request
              └────────────────────────────────┘
                            │
                            ▼
              Laravel API: http://localhost:8000/api/v1/*
```

### Các thành phần

| Thành phần | Trách nhiệm |
|---|---|
| `next.config.ts` | Bật `output: "export"` để sinh static bundle vào `out/` |
| `out/` | Static HTML/JS/CSS — input của Tauri bundler |
| `src-tauri/tauri.conf.json` | Cấu hình app (window, identifier, bundle, CSP) |
| `src-tauri/capabilities/default.json` | Allowlist API + URL scope mà frontend được gọi |
| `src-tauri/src/lib.rs` | Entry Rust — register plugin, setup hooks |
| `src-tauri/Cargo.toml` | Rust dependencies |
| `src/lib/api/client.ts` | Detect runtime, dùng plugin-http khi trong Tauri |

## 3. Hai mode chạy

Dev Tools chạy được trong cả browser lẫn Tauri từ cùng một code base:

- **Browser** — `npm run dev`. App chạy trong Chrome/Safari, gọi
  Laravel qua `fetch` thông thường (cần backend bật CORS).
- **Desktop** — `npm run tauri:dev` cho dev hot-reload, hoặc
  `npm run tauri:build` để đóng gói. Khi chạy trong Tauri, `apiFetch`
  detect `window.__TAURI_INTERNALS__` và route qua `tauri-plugin-http`.

## 4. Data flow lúc khởi động

1. `Dev Tools.app` mở → WKWebView load `index.html` từ bundle.
2. Server Component `src/app/page.tsx` (đã pre-render thành HTML
   tĩnh) render với fallback list types/presets — không gọi API ở
   build-time.
3. Client component `FormatterPage` mount, `useEffect` gọi
   `apiFetch("/api/v1/types/{type}/presets")` → request đi qua
   `tauri-plugin-http` → Rust core gửi HTTP request đến Laravel →
   response trả về client.
4. UI hiển thị danh sách preset thật, người dùng bắt đầu format.

## 5. Tài liệu liên quan

- [`07-tauri-prerequisites-macos.md`](./07-tauri-prerequisites-macos.md) —
  Cài Xcode CLT, Rust, npm deps.
- [`08-tauri-frontend-static-export.md`](./08-tauri-frontend-static-export.md) —
  Vì sao dùng static export và những thay đổi trong Next.js.
- [`09-tauri-config-and-capabilities.md`](./09-tauri-config-and-capabilities.md) —
  Giải thích từng dòng `tauri.conf.json` và capabilities.
- [`10-tauri-build-macos-arm64.md`](./10-tauri-build-macos-arm64.md) —
  Hướng dẫn dev và build chi tiết.
- [`11-tauri-troubleshooting.md`](./11-tauri-troubleshooting.md) —
  Các lỗi thường gặp và cách xử lý.
