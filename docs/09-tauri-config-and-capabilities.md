# Cấu hình Tauri & Capabilities

Tài liệu này giải thích từng thành phần trong `src-tauri/`. Dùng làm
reference khi:

- Đổi tên app, kích thước window, identifier.
- Tighten/loosen CSP.
- Thêm scope HTTP mới.
- Thêm plugin Tauri khác.

## 1. Cấu trúc thư mục `src-tauri/`

```
src-tauri/
├── Cargo.toml              # Rust deps
├── Cargo.lock              # Pin Rust deps (commit để build reproducible)
├── build.rs                # Build script (sinh code từ tauri.conf.json)
├── tauri.conf.json         # Cấu hình app
├── capabilities/
│   └── default.json        # Allowlist API + URL scope
├── icons/                  # Bundle icons (.png/.icns/.ico)
└── src/
    ├── main.rs             # Binary entry — chỉ gọi lib::run()
    └── lib.rs              # App logic, register plugins
```

## 2. `tauri.conf.json` — giải thích từng trường

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "Dev Tools",
  "version": "0.1.0",
  "identifier": "com.quocnguyen2001.devtools",
  "build": {
    "frontendDist": "../out",
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Dev Tools",
        "width": 1280,
        "height": 800,
        "minWidth": 960,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; img-src 'self' data: blob: asset: http://asset.localhost; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; font-src 'self' data:; worker-src 'self' blob:; connect-src 'self' ipc: http://ipc.localhost http://localhost:8000 https://localhost:8000"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["app", "dmg"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "macOS": {
      "minimumSystemVersion": "12.0"
    }
  }
}
```

### Top-level

| Trường | Ý nghĩa |
|---|---|
| `productName` | Tên hiển thị (Finder, Dock, Activity Monitor) |
| `version` | Version semver, đi vào tên file `.dmg` |
| `identifier` | Bundle ID kiểu reverse-DNS, **bắt buộc** unique |

> **Đổi identifier** khi fork repo cho org khác. Bundle ID là khóa
> tiếng vọng của macOS — 2 app cùng identifier sẽ conflict.

### `build`

| Trường | Ý nghĩa |
|---|---|
| `frontendDist` | Đường dẫn (relative từ `src-tauri/`) đến static bundle |
| `devUrl` | URL Tauri sẽ load trong dev mode |
| `beforeDevCommand` | Tauri CLI chạy lệnh này trước khi mở dev window |
| `beforeBuildCommand` | Tauri CLI chạy trước khi cargo build release |

Pipeline `tauri build`:

```
beforeBuildCommand (npm run build)
        ↓
read frontendDist (../out)
        ↓
cargo build --release
        ↓
bundle .app + .dmg
```

### `app.windows[0]`

| Trường | Default ở đây | Ghi chú |
|---|---|---|
| `label` | `"main"` | ID nội bộ, dùng khi gọi API window |
| `title` | `"Dev Tools"` | Tiêu đề thanh title bar |
| `width` / `height` | 1280×800 | Kích thước mặc định khi mở |
| `minWidth` / `minHeight` | 960×600 | Giới hạn dưới khi user resize |
| `resizable` | true | Cho phép kéo cạnh window |
| `fullscreen` | false | Không tự fullscreen |

Có thể thêm:

- `decorations: false` — bỏ title bar (cần custom drag region).
- `transparent: true` — window trong suốt (cần special CSS).
- `center: true` — center window khi mở.

### `app.security.csp`

CSP được inject vào mọi response Tauri. Chia theo directive:

| Directive | Cho phép | Vì sao |
|---|---|---|
| `default-src 'self'` | Chỉ cho asset từ chính bundle | Default an toàn |
| `img-src 'self' data: blob: asset: http://asset.localhost` | Asset images, data URIs, blob URLs, Tauri asset protocol | Monaco có thể inline image, Tauri serve assets qua `asset.localhost` |
| `style-src 'self' 'unsafe-inline'` | CSS từ bundle + inline `<style>` | Tailwind v4 inject CSS động cần `unsafe-inline` |
| `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:` | JS bundle + inline + eval + worker scripts | Monaco editor cần `eval` cho language services |
| `font-src 'self' data:` | Font local + data URIs | Geist fonts inline data |
| `worker-src 'self' blob:` | Web Workers | Monaco language services chạy trong workers |
| `connect-src 'self' ipc: http://ipc.localhost http://localhost:8000 https://localhost:8000` | IPC + Laravel API | Frontend gọi ra ngoài cần whitelist từng origin |

> **Khi backend đổi origin** (vd. dùng `https://api.devtools.local`),
> thêm origin đó vào `connect-src`. Đồng thời sửa
> `capabilities/default.json` (xem mục 4).

### `bundle`

| Trường | Default | Ghi chú |
|---|---|---|
| `active` | true | Bật/tắt bundling |
| `targets` | `["app", "dmg"]` | Sinh cả `.app` (raw) và `.dmg` (installer) |
| `icon` | 5 files | Tauri bundle theo các size mặc định |
| `macOS.minimumSystemVersion` | `"12.0"` | Match với prerequisites |

Targets khả dụng cho macOS:

- `"app"` — bundle thư mục `.app` đơn giản.
- `"dmg"` — installer DMG có drag-to-Applications.
- `"updater"` — file metadata cho auto-update (cần signing).

## 3. `Cargo.toml`

```toml
[package]
name = "dev-tools-app"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2021"

[lib]
name = "dev_tools_app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.11.2" }
tauri-plugin-log = "2"
tauri-plugin-http = "2"
```

| Dep | Vai trò |
|---|---|
| `tauri` | Core runtime |
| `tauri-plugin-log` | Logging (chỉ active trong debug build) |
| `tauri-plugin-http` | HTTP client từ Rust core, frontend gọi qua `@tauri-apps/plugin-http` |
| `serde` / `serde_json` | Serialize giữa Rust ↔ JS |

> **Thêm plugin Tauri mới**: chạy `cargo add tauri-plugin-XXX` trong
> `src-tauri/`, register trong `lib.rs`, npm install JS binding tương ứng.

## 4. `capabilities/default.json` — bảo mật cốt lõi

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for the Dev Tools desktop app.",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "http:default",
    {
      "identifier": "http:allow-fetch",
      "allow": [
        { "url": "http://localhost:8000/*" },
        { "url": "http://127.0.0.1:8000/*" }
      ]
    }
  ]
}
```

### Cơ chế

Tauri v2 dùng **capability-based security**: mọi API plugin gọi từ JS
phải được declare. Frontend gọi API không có trong capability → reject
ở Rust side, không thể bypass.

| Permission | Ý nghĩa |
|---|---|
| `core:default` | Cho window/event/path APIs cơ bản |
| `http:default` | Bật command bindings của plugin-http |
| `http:allow-fetch` (scoped) | Whitelist URL nào fetch được |

### Đổi backend URL

Khi backend dời sang host/port khác:

```json
{
  "identifier": "http:allow-fetch",
  "allow": [
    { "url": "http://localhost:8000/*" },
    { "url": "http://127.0.0.1:8000/*" },
    { "url": "https://api.staging.example.com/*" }
  ]
}
```

Sau đó cũng thêm origin vào `tauri.conf.json -> app.security.csp.connect-src`.

### Pattern URL được hỗ trợ

- `http://localhost:8000/*` — match path bất kỳ
- `http://localhost:8000/api/v1/*` — chỉ scope `/api/v1/`
- `https://*.example.com/*` — wildcard subdomain (cẩn thận!)

> Càng narrow càng an toàn. Tránh wildcard rộng.

## 5. `src/lib.rs`

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

| Dòng | Ý nghĩa |
|---|---|
| `.plugin(tauri_plugin_http::init())` | Wire plugin HTTP — frontend dùng được `@tauri-apps/plugin-http` |
| `setup(|app| ...)` | Hook chạy 1 lần khi app khởi động |
| `if cfg!(debug_assertions)` | Chỉ load logger trong debug build |
| `tauri::generate_context!()` | Macro đọc `tauri.conf.json` thành RuntimeConfig |

### Thêm command Rust → JS (custom IPC)

Nếu sau này cần command tự define:

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .invoke_handler(tauri::generate_handler![greet])
    .run(tauri::generate_context!())
    .expect("...");
}
```

Frontend:

```ts
import { invoke } from "@tauri-apps/api/core";
const msg = await invoke<string>("greet", { name: "World" });
```

Hiện tại app **không** dùng custom command — toàn bộ logic ở Next.js,
Rust chỉ là shell + HTTP.

## 6. Custom HTTP headers (X-API-KEY)

`apiFetch` set `X-API-KEY` trên mọi request. Plugin-http cho phép
custom headers nếu URL match scope. Không cần config thêm.

Nếu Tauri báo lỗi "header not allowed" cho header nhạy cảm (hiếm khi
xảy ra với header thường), bật `unsafe-headers`:

```toml
tauri-plugin-http = { version = "2", features = ["unsafe-headers"] }
```

## 7. Icons

Lệnh sinh full set icon từ 1 file PNG:

```bash
npx tauri icon path/to/logo.png
```

CLI sinh:

- `icons/32x32.png`
- `icons/128x128.png`
- `icons/128x128@2x.png`
- `icons/icon.icns` (macOS)
- `icons/icon.ico` (Windows)
- Và Android/iOS icons nếu có config mobile.

Hiện tại đang dùng icon mặc định Tauri sinh ra (logo Tauri). **Nên
thay** trước khi distribute.

## 8. Trạng thái hiện tại của repo

Sau khi `tauri init` + chỉnh các file trên, repo có:

```
src-tauri/
├── Cargo.toml          # đã add tauri-plugin-http
├── Cargo.lock          # auto
├── build.rs            # default
├── tauri.conf.json     # đã chỉnh productName, identifier, window, CSP, bundle
├── capabilities/
│   └── default.json    # đã thêm http:default + http:allow-fetch scope
├── icons/              # default Tauri icons
└── src/
    ├── main.rs         # default
    └── lib.rs          # đã thêm .plugin(tauri_plugin_http::init())
```

Tiếp tục với [`10-tauri-build-macos-arm64.md`](./10-tauri-build-macos-arm64.md) để dev và build.
