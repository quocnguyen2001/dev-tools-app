# Tauri Troubleshooting

Các lỗi thường gặp và cách xử lý nhanh.

## A. Setup / cài đặt

### `xcrun: error: invalid active developer path`

Xcode Command Line Tools chưa cài hoặc bị broken.

```bash
sudo rm -rf /Library/Developer/CommandLineTools
xcode-select --install
```

### `command not found: cargo` (sau khi cài rustup)

Path chưa load. Mở terminal mới hoặc:

```bash
source "$HOME/.cargo/env"
```

rustup mặc định ghi vào `~/.zshenv` (zsh) hoặc `~/.bash_profile` (bash).
Nếu bạn dùng shell config khác, thêm dòng sau vào file rc tương ứng:

```bash
. "$HOME/.cargo/env"
```

### `npm run tauri:dev` báo `failed to run 'cargo metadata' command ... No such file or directory (os error 2)`

Cùng nguyên nhân với mục trên: terminal session hiện tại được mở
**trước** khi rustup cài, nên PATH chưa có `~/.cargo/bin`. Tauri CLI
spawn `cargo` qua child process, không tìm thấy.

Fix:

```bash
source "$HOME/.cargo/env"
npm run tauri:dev
```

Hoặc đóng terminal cũ + mở terminal mới.

Verify nhanh trước khi chạy lại:

```bash
which cargo            # phải in /Users/<user>/.cargo/bin/cargo
cargo --version        # phải in version
```

### `npx tauri info` báo missing toolchain

Check từng dòng output:

- "Xcode Command Line Tools: not installed" → `xcode-select --install`.
- "rustc: not installed" → cài rustup (xem doc 07).
- "Frontend Dist: not found" → chạy `npm run build` trước, hoặc check
  đường dẫn trong `tauri.conf.json`.

## B. Build frontend (`npm run build`)

### `Server Components are not supported in static export`

Một route nào đó đang dùng dynamic rendering. Common nguyên nhân:

- `export const dynamic = "force-dynamic"` còn sót.
- `cookies()`, `headers()` được gọi.
- `fetch(url, { cache: 'no-store' })` ở Server Component.
- API route `/app/api/*` (cần Next.js server).

Cách fix:

- Bỏ `force-dynamic`.
- Move logic cần runtime ra Client Component.
- Hard-code fallback ở Server Component (như `src/app/page.tsx`).

### `Module not found: @tauri-apps/plugin-http`

```bash
npm install @tauri-apps/plugin-http@^2
```

### `out/` rỗng sau khi build

`next.config.ts` thiếu `output: "export"`. Verify:

```ts
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};
```

## C. Build Rust (`cargo build` / `tauri:build`)

### `linker 'cc' not found`

Xcode CLT chưa cài hoặc path sai.

```bash
xcode-select --install
xcode-select -p     # phải in path
```

### `error: target may not be installed: 'aarch64-apple-darwin'`

```bash
rustup target add aarch64-apple-darwin
rustup show
```

### `error[E0432]: unresolved import 'tauri_plugin_http'`

`Cargo.toml` chưa add dep. Check:

```toml
[dependencies]
tauri-plugin-http = "2"
```

Sau đó `cargo build` lại.

### `failed to download crate ...`

Network issue hoặc proxy. Thử:

```bash
cargo clean
cargo fetch --verbose
```

Nếu sau công ty có proxy, set `~/.cargo/config.toml`:

```toml
[http]
proxy = "http://proxy.company.com:8080"
```

### Build mất quá lâu (>10 phút) lần đầu

Bình thường lần đầu mất 3–5 phút. Nếu lâu hơn, kiểm tra:

- Disk free đủ không (`df -h`) — Rust cache cần ~3–5 GB.
- Network OK không — đang download crates từ crates.io.
- CPU idle hay đang chạy app khác.

Lần build sau dùng cache, nhanh ~30s–1 phút.

## D. Runtime — chạy app

### Editor (Monaco) đứng yên ở loading skeleton trong production build, dev mode lại bình thường

Nguyên nhân: `@monaco-editor/react` mặc định load Monaco từ
`https://cdn.jsdelivr.net`. CSP của Tauri (`script-src 'self'`) chặn
external CDN trong production build, nên editor stuck loading.

Project đã giải quyết bằng cách:

- Script `scripts/copy-monaco.mjs` copy `node_modules/monaco-editor/min/vs`
  sang `public/monaco-editor/vs` trước mọi `npm run dev` / `npm run build`
  (qua `predev` / `prebuild` npm scripts).
- `src/lib/monaco-loader.ts` gọi `loader.config({ paths: { vs: "/monaco-editor/vs" } })`
  để Monaco loader đọc từ bundle local thay vì CDN.

Nếu sau khi pull code mà vẫn dính loading:

```bash
# Force regenerate Monaco bundle
rm -rf public/monaco-editor
npm run build         # prebuild script sẽ copy lại

# Verify
ls public/monaco-editor/vs/loader.js
ls out/monaco-editor/vs/loader.js     # static export đã include

# Rebuild app
source "$HOME/.cargo/env"
npm run tauri:build -- --target aarch64-apple-darwin
```

> **Đừng** add `cdn.jsdelivr.net` vào `script-src` để fix — bundle local
> đảm bảo app chạy offline và nhanh hơn vì không phải fetch ngoài.

### Window mở nhưng white screen

Likely the static bundle is missing or stale.

```bash
# Verify bundle
ls out/index.html

# Rebuild
rm -rf .next out
npm run build
ls out/index.html       # phải tồn tại
```

Nếu vẫn white screen, mở DevTools (`⌥⌘I` trong dev mode) đọc Console
lỗi.

### `Failed to fetch` / `Network request failed` trong app

Backend Laravel chưa chạy hoặc URL sai. Check thứ tự:

```bash
# 1. Backend chạy chưa?
curl -i http://localhost:8000/api/v1/types -H "X-API-KEY: dev-local-key"

# 2. Env có đúng không?
grep NEXT_PUBLIC .env.local

# 3. URL trong app match với capability scope không?
cat src-tauri/capabilities/default.json
```

### `Forbidden` / `not allowed` khi gọi API trong Tauri

Capability scope không match URL. Mở
`src-tauri/capabilities/default.json`:

```json
{
  "identifier": "http:allow-fetch",
  "allow": [
    { "url": "http://localhost:8000/*" }
  ]
}
```

URL request phải match một entry. Sửa lại + rebuild.

### `connect-src violates Content Security Policy` ở browser console

CSP trong `tauri.conf.json -> app.security.csp` không có origin tương
ứng. Thêm vào `connect-src`:

```
connect-src 'self' ipc: http://ipc.localhost http://localhost:8000 https://api.example.com
```

### App mở 1 giây rồi tắt, không có lỗi gì

Crash silent. Mở Console.app trên macOS → Search "Format Hub" → đọc
crash log. Thường là:

- Missing entitlement (rare khi unsigned).
- Plugin init panic — đọc Rust panic message.

Hoặc chạy app từ terminal để xem stderr:

```bash
"src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Format Hub.app/Contents/MacOS/Format Hub"
```

## E. Gatekeeper / signing

### `"Format Hub" is damaged and can't be opened`

App bị quarantine attribute do download/transfer. Strip:

```bash
xattr -dr com.apple.quarantine "Format Hub.app"
```

### `"Format Hub" cannot be opened because the developer cannot be verified`

App unsigned, Gatekeeper chặn. Right-click → Open lần đầu, hoặc dùng
xattr ở trên.

### Muốn signed/notarized

Out of scope tài liệu này. Đọc:
<https://v2.tauri.app/distribute/sign/macos/>

Cần Apple Developer account ($99/năm).

## F. Plugin & dependency

### Mismatch giữa `@tauri-apps/cli` và `@tauri-apps/api`

```bash
npm ls @tauri-apps/cli @tauri-apps/api @tauri-apps/plugin-http
```

Cả 3 phải ở major 2.x. Nếu không:

```bash
npm install @tauri-apps/cli@^2 @tauri-apps/api@^2 @tauri-apps/plugin-http@^2
```

### Mismatch giữa Rust crate và JS plugin

Rust `tauri-plugin-http = "2"` phải pair với JS
`@tauri-apps/plugin-http@^2`. Major version phải khớp.

### Plugin command bị reject

Frontend gọi command nhưng backend trả lỗi "command not found".
Nguyên nhân:

- Plugin chưa register trong `lib.rs`. Thêm:
  ```rust
  .plugin(tauri_plugin_http::init())
  ```
- Capability thiếu permission. Thêm `"http:default"` vào
  `capabilities/default.json`.

## G. Performance

### Cargo cache eat disk

```bash
cd src-tauri && cargo clean    # giải phóng target/
rm -rf ~/.cargo/registry/cache # giải phóng global cache (sẽ download lại)
```

### Bundle size lớn bất thường

Check binary size:

```bash
ls -lh "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Format Hub.app/Contents/MacOS/Format Hub"
```

Bình thường ~5–10 MB. Nếu lớn hơn nhiều:

- Bật strip trong `Cargo.toml`:
  ```toml
  [profile.release]
  strip = true
  lto = true
  codegen-units = 1
  ```
- Rebuild.

### App khởi động chậm

WKWebView lần đầu load ~500ms–1s là bình thường. Nếu chậm hơn:

- Check `out/_next/static/` có quá lớn không.
- Bật React Profiler để check render time.
- Defer non-critical Monaco language services.

## H. Hỏi đáp khác

### Có thể debug Rust trong dev không?

Có. Set `RUST_LOG=debug` rồi chạy:

```bash
RUST_LOG=debug npm run tauri:dev
```

`tauri-plugin-log` đã được register trong debug build, log sẽ in ra
terminal.

### Tauri dev mở 2 window?

Bình thường nếu trước đó đã có process `tauri:dev` chưa kill. Check:

```bash
ps aux | grep tauri
```

Kill process còn sót.

### App icon vẫn là logo Tauri

Đang dùng icon mặc định. Thay bằng:

```bash
npx tauri icon path/to/your-logo.png
npm run tauri:build -- --target aarch64-apple-darwin
```

## Tài nguyên

- Tauri v2 docs: <https://v2.tauri.app/>
- Plugins workspace: <https://github.com/tauri-apps/plugins-workspace>
- Bundled skill notes: `.agents/skills/tauri-v2/`
- Rust book: <https://doc.rust-lang.org/book/>

Nếu còn lỗi không có ở đây, search trên GitHub Issues của Tauri:
<https://github.com/tauri-apps/tauri/issues>.
