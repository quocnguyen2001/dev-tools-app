# Development & Build — macOS Apple Silicon

Tài liệu này hướng dẫn workflow đầy đủ:

1. Cấu hình env trước khi chạy.
2. Development mode với hot reload.
3. Production build và đóng gói thành `.app` + `.dmg`.
4. Cài, chạy, gỡ app.
5. Clean build khi cần.

> Trước khi bắt đầu: đảm bảo đã làm hết các bước trong
> [`07-tauri-prerequisites-macos.md`](./07-tauri-prerequisites-macos.md)
> và `npx tauri info` không báo lỗi.

## 1. Cấu hình environment variables

### File `.env.local`

Project dùng `NEXT_PUBLIC_*` để inject vào bundle tại **build-time**.
Tạo file `.env.local` ở root repo (copy từ `.env.local.example`):

```bash
cp .env.local.example .env.local
```

Nội dung mặc định:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=dev-local-key
```

| Biến | Mô tả |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend Laravel base URL — sẽ được dùng ở `apiFetch` |
| `NEXT_PUBLIC_API_KEY` | Key gửi qua header `X-API-KEY` cho mọi request |

> **Quan trọng**: 2 biến này được **inline** vào JS bundle khi build,
> ai có file `.app` đều xem được. Chỉ dùng key dev local. Production
> auth phải dùng OAuth/SSO/keychain — vượt scope tài liệu này.

### Đổi backend URL

Nếu backend không chạy ở `localhost:8000`:

1. Sửa `NEXT_PUBLIC_API_BASE_URL` trong `.env.local`.
2. Sửa scope trong `src-tauri/capabilities/default.json`
   (xem [doc 09](./09-tauri-config-and-capabilities.md#4-capabilitiesdefaultjson)).
3. Sửa `connect-src` trong `tauri.conf.json -> app.security.csp`.
4. Rebuild.

### Khởi động backend trước

```bash
# Trong repo Laravel:
php artisan serve --host=127.0.0.1 --port=8000
```

App desktop **không** start backend tự động. Mở backend trước rồi mới
mở app.

## 2. Development mode (hot reload)

### Chạy

```bash
npm run tauri:dev
```

Tauri CLI chạy chuỗi:

```
1. spawn `npm run dev` (Next.js dev server)
   ↓ wait for http://localhost:3000 lên
2. cargo build --debug    (~30–60s lần đầu, sau đó cache)
   ↓
3. mở Tauri window load http://localhost:3000
```

Lần đầu compile Rust mất ~1 phút (download crates + build
debug binary). Lần sau Cargo dùng cache, nhanh ~5–10s.

### Hot reload

- Sửa file `src/**/*` → Next.js HMR refresh ngay trong Tauri window.
- Sửa file `src-tauri/src/**/*.rs` → Tauri tự rebuild Rust binary và
  reload app window.
- Sửa `tauri.conf.json` hoặc `capabilities/*.json` → Ctrl+C và chạy
  lại `npm run tauri:dev`.

### Mở DevTools trong Tauri window

Trong dev build, DevTools available:

- macOS: `⌥⌘I` (Option + Cmd + I)
- Hoặc right-click → Inspect Element

Production build (release) **mặc định tắt** DevTools — đó là behavior
mong muốn. Để bật cho debug release:

```rust
// src-tauri/src/lib.rs
.setup(|app| {
    #[cfg(debug_assertions)]
    {
        let window = app.get_webview_window("main").unwrap();
        window.open_devtools();
    }
    Ok(())
})
```

### Force refresh

`⌘+R` trong Tauri window reload UI từ dev server.

### Stop

`Ctrl+C` ở terminal đang chạy `tauri:dev`. CLI sẽ kill cả Next.js dev
server lẫn Tauri window.

## 3. Production build

### Lệnh chính

```bash
npm run tauri:build -- --target aarch64-apple-darwin
```

Pipeline:

```
1. npm run build              (~10–20s)
   - Next.js sinh static export → out/
   - Verify out/index.html tồn tại
   ↓
2. cargo build --release      (~3–5 phút lần đầu, ~30s sau cache)
   - Compile Rust với optimization -O3 + LTO
   ↓
3. bundle assets              (~5–10s)
   - Tạo Dev Tools.app từ binary + frontend + Info.plist
   - Tạo Dev Tools_0.1.0_aarch64.dmg với drag-to-Applications
```

### Output artifacts

```
src-tauri/target/aarch64-apple-darwin/release/bundle/
├── macos/
│   └── Dev Tools.app                       # raw app bundle, ~10–20 MB
└── dmg/
    └── Dev Tools_0.1.0_aarch64.dmg         # installer DMG, ~10–20 MB
```

| File | Dùng khi |
|---|---|
| `Dev Tools.app` | Test nhanh, copy vào `/Applications`, debug |
| `Dev Tools_X.Y.Z_aarch64.dmg` | Distribute (gửi cho user khác) |

> **Tên file DMG**: `<productName>_<version>_<arch>.dmg`. Đổi
> `productName` hoặc `version` trong `tauri.conf.json` để đổi tên.

### Vì sao chỉ định `--target`

Mặc dù máy bạn là ARM64 và Cargo sẽ tự target host arch, lệnh
`--target aarch64-apple-darwin` đảm bảo:

- Output path luôn là `target/aarch64-apple-darwin/release/...`
  (predictable — script CI dễ pickup).
- Tránh nhầm lẫn nếu sau này build cross-arch.

### Build cho universal binary (ARM64 + x86_64)

Out of scope hiện tại, nhưng nếu cần:

```bash
rustup target add x86_64-apple-darwin
npm run tauri:build -- --target universal-apple-darwin
```

Output: `target/universal-apple-darwin/release/bundle/macos/Dev Tools.app`.

## 4. Cài và chạy app

### Option A — chạy trực tiếp `.app`

```bash
open "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Dev Tools.app"
```

**Lần đầu** macOS chặn vì app unsigned (Gatekeeper). 2 cách bypass:

**Cách 1 — Right-click → Open**

1. Mở Finder, navigate đến `Dev Tools.app`.
2. Right-click → **Open**.
3. Dialog hiện "macOS cannot verify..." → bấm **Open** (không phải
   button mặc định).
4. macOS nhớ quyết định — lần sau click bình thường.

**Cách 2 — Strip quarantine attribute**

```bash
xattr -dr com.apple.quarantine "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Dev Tools.app"
open "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Dev Tools.app"
```

Sau đó double-click bình thường.

### Option B — cài qua DMG

1. Double-click `Dev Tools_0.1.0_aarch64.dmg`.
2. Cửa sổ DMG mở ra với icon `Dev Tools.app` và shortcut `Applications`.
3. Drag `Dev Tools.app` sang `Applications`.
4. Eject DMG.
5. Mở từ Spotlight: `⌘+Space` → gõ "Dev Tools" → Enter.
6. Lần đầu vẫn dính Gatekeeper — apply 1 trong 2 cách trên.

### Verify app hoạt động đúng

Khi app mở:

1. Window title đọc `Dev Tools`, kích thước 1280×800.
2. Formatter hiện ra với type list mặc định: JSON / HTML / CSS /
   JavaScript / SQL.
3. Sau ~1 giây, list types/presets refresh từ backend (yêu cầu
   Laravel chạy).
4. Paste JSON → bấm Format → output formatted hiện ra.
5. Bấm `⌘+Enter` cũng trigger Format.

Nếu format fail mà toast báo "Network error" hoặc "Failed to fetch":

- Kiểm tra Laravel chạy chưa: `curl http://localhost:8000/api/v1/types`.
- Kiểm tra `NEXT_PUBLIC_API_KEY` trong `.env.local` đúng chưa
  (so sánh với key Laravel chấp nhận).
- Đọc thêm [`11-tauri-troubleshooting.md`](./11-tauri-troubleshooting.md).

## 5. Clean build

Khi gặp lỗi không rõ nguyên nhân, hoặc đã sửa `Cargo.toml` /
`tauri.conf.json` mà thay đổi không reflect:

```bash
# Clean Rust artifacts (giải phóng vài GB)
cd src-tauri
cargo clean
cd -

# Clean Next.js cache + static export
rm -rf .next out

# Build lại
npm run tauri:build -- --target aarch64-apple-darwin
```

Build sạch lần đầu mất ~3–5 phút (compile lại toàn bộ Rust crate
graph).

## 6. So sánh các lệnh npm

| Lệnh | Dùng khi | Output |
|---|---|---|
| `npm run dev` | Dev UI nhanh trong browser | http://localhost:3000 |
| `npm run build` | Sinh static export | `out/` |
| `npm run start` | Chạy static export qua Next server | http://localhost:3000 |
| `npm run lint` | Check code style | exit 0/1 |
| `npm run tauri:dev` | Dev app desktop hot-reload | Tauri window |
| `npm run tauri:build` | Build production app | `.app` + `.dmg` |

## 7. Workflow khuyến nghị

### Khi sửa UI

```bash
# Terminal 1: backend
cd ../laravel-repo && php artisan serve

# Terminal 2: dev UI
cd dev-tools-app
npm run tauri:dev

# Sửa code → window auto-reload
```

### Khi sửa Tauri config / Rust

```bash
# Sau khi sửa tauri.conf.json hoặc lib.rs:
# Ctrl+C tauri:dev đang chạy, rồi:
npm run tauri:dev
```

### Khi muốn ship app

```bash
# 1. Lint + test
npm run lint
npm run build       # smoke test static export

# 2. Build production
npm run tauri:build -- --target aarch64-apple-darwin

# 3. Test app trước khi gửi
open "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Dev Tools.app"
# (apply Gatekeeper bypass nếu cần)

# 4. Distribute DMG
ls "src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/"
```

## 8. Phụ lục — version bump

Khi release version mới:

1. Sửa `package.json -> version`.
2. Sửa `src-tauri/tauri.conf.json -> version` (phải match).
3. Sửa `src-tauri/Cargo.toml -> [package].version` (phải match).
4. Build → tên DMG sẽ có version mới.

3 file phải sync để tránh confuse user.

## 9. Tóm tắt 1 dòng

| Mục đích | Lệnh |
|---|---|
| Dev với hot reload | `npm run tauri:dev` |
| Build app cho M-series | `npm run tauri:build -- --target aarch64-apple-darwin` |
| Mở app vừa build | `open "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Dev Tools.app"` |
| Bypass Gatekeeper | `xattr -dr com.apple.quarantine "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Dev Tools.app"` |
| Clean rebuild | `cd src-tauri && cargo clean && cd - && rm -rf .next out` |

Khi gặp lỗi → [`11-tauri-troubleshooting.md`](./11-tauri-troubleshooting.md).
