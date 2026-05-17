# Cài đặt môi trường — macOS Apple Silicon

Hướng dẫn cài tất cả công cụ cần thiết để dev và build Dev Tools
thành ứng dụng desktop macOS trên máy Apple Silicon (M1/M2/M3/M4).

> Mỗi bước đều có lệnh verify. Đảm bảo bước đó pass trước khi qua bước
> tiếp theo.

## 1. Yêu cầu hệ thống

| Yêu cầu | Phiên bản tối thiểu |
|---|---|
| macOS | 12 (Monterey) |
| CPU | Apple Silicon (arm64) |
| Disk free | ~5 GB (Rust cache + build artifacts) |

Verify:

```bash
sw_vers              # ProductVersion phải >= 12.0
uname -m             # phải là "arm64"
```

`tauri.conf.json` đã set `bundle.macOS.minimumSystemVersion = "12.0"`,
build sẽ fail trên macOS < 12.

## 2. Xcode Command Line Tools

Cần `clang`, `ld`, `libtool`, macOS SDK headers để Rust toolchain link
binary.

```bash
xcode-select --install
```

Một dialog sẽ hiện ra → bấm Install → đợi 5–10 phút.

Verify:

```bash
xcode-select -p          # in ra path đến CommandLineTools
clang --version          # in ra Apple clang version
```

Nếu sau này chuyển sang Xcode đầy đủ, chạy:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## 3. Rust toolchain

Cài qua rustup (script chính thức):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
  --default-toolchain stable \
  --profile minimal \
  --target aarch64-apple-darwin
```

Giải thích flags:

- `-y` — không hỏi confirm.
- `--default-toolchain stable` — dùng nhánh stable (không nightly).
- `--profile minimal` — chỉ cài `rustc`, `cargo`, `rust-std` (không cài
  docs / rust-analyzer-binaries — tiết kiệm ~500 MB).
- `--target aarch64-apple-darwin` — đảm bảo target ARM64 sẵn sàng.

Sau khi cài xong, mở terminal mới hoặc:

```bash
source "$HOME/.cargo/env"
```

> **Quan trọng**: rustup chỉ thêm `~/.cargo/bin` vào PATH cho terminal
> mở **sau khi** cài. Nếu bạn cài rustup xong rồi tiếp tục dùng terminal
> đang mở từ trước, các lệnh `cargo` / `npm run tauri:*` sẽ báo
> "command not found" hoặc "No such file or directory". Cách fix:
> đóng terminal đó và mở terminal mới, hoặc `source "$HOME/.cargo/env"`
> trong terminal hiện tại.

Verify:

```bash
rustc --version          # vd: rustc 1.85.0 (...)
cargo --version          # vd: cargo 1.85.0 (...)
rustup target list --installed
# Phải có dòng: aarch64-apple-darwin
```

Nếu thiếu target ARM64:

```bash
rustup target add aarch64-apple-darwin
```

## 4. Node.js & npm

Project dùng `next@16.2.6` + `react@19.2.4`, cần Node 20+.

Verify:

```bash
node --version           # >= 20
npm --version            # >= 10
```

Nếu chưa có Node, cài qua [nvm](https://github.com/nvm-sh/nvm) hoặc
[fnm](https://github.com/Schniz/fnm).

## 5. Project npm dependencies

Từ thư mục root của repo:

```bash
npm install
```

Lệnh này cài tất cả deps (Next.js, React, Monaco, Tailwind...) cộng
với 3 package Tauri đã được khai báo trong `package.json`:

| Package | Vai trò |
|---|---|
| `@tauri-apps/cli` (devDep) | CLI `tauri` — init/dev/build |
| `@tauri-apps/api` | JS bindings cho core APIs (window, event...) |
| `@tauri-apps/plugin-http` | Frontend bindings cho plugin HTTP |

Verify:

```bash
npm ls @tauri-apps/cli @tauri-apps/api @tauri-apps/plugin-http
```

Cả 3 phải hiển thị version 2.x.

## 6. Tauri sanity check

```bash
npx tauri info
```

Output sẽ in ra:

- macOS host: phải nhận đúng arch `aarch64`.
- Rust: phải tìm thấy `rustc` và `cargo`.
- Frontend: `Frontend Dist: ../out`, `Dev URL: http://localhost:3000`.
- Tauri CLI / API / Rust: tất cả ở major 2.x.

Nếu báo missing nào đó, quay lại bước tương ứng ở trên rồi chạy lại.

## 7. Backend Laravel chạy local

Tauri **không** đi kèm backend. App gọi đến `http://localhost:8000` —
đây là URL bạn đã cấu hình trong `.env.local` (`NEXT_PUBLIC_API_BASE_URL`).
Đảm bảo Laravel chạy trước khi mở app:

```bash
# Trong repo Laravel:
php artisan serve --host=127.0.0.1 --port=8000
```

Capability allowlist trong `src-tauri/capabilities/default.json` chỉ
cho phép `http://localhost:8000` và `http://127.0.0.1:8000`. Nếu bạn
chạy ở host/port khác, edit file đó (xem [doc 09](./09-tauri-config-and-capabilities.md)).

## 8. Tóm tắt

Sau khi xong các bước trên, bạn nên có:

```bash
$ rustc --version && cargo --version
rustc 1.85.0 (...)
cargo 1.85.0 (...)

$ node --version && npm --version
v20.x.x
10.x.x

$ rustup target list --installed | grep aarch64-apple-darwin
aarch64-apple-darwin

$ npx tauri info | head -10
[✔] Environment
    - OS: Mac OS 14.x.x arm64 (X64)
    - Xcode Command Line Tools: installed
    - rustc: 1.85.0
    - cargo: 1.85.0
    ...
```

Sang bước tiếp theo: [`08-tauri-frontend-static-export.md`](./08-tauri-frontend-static-export.md).
