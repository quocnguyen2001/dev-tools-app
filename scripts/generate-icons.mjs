// Generate all raster + bundle icons (web, PWA, Tauri) and the OG image
// from public/logo-mark.svg as the single source of truth.
//
// Idempotent: deletes regenerated outputs before re-creating them.

import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import pngToIco from "png-to-ico";

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(projectRoot, "public");
const APP_DIR = resolve(projectRoot, "src/app");
const TAURI_ICONS_DIR = resolve(projectRoot, "src-tauri/icons");

const MARK_SVG_PATH = resolve(PUBLIC_DIR, "logo-mark.svg");

/** Render the mark SVG to a PNG buffer at a given square size. */
async function renderMarkPng(size, svgBuffer) {
  return sharp(svgBuffer, { density: Math.max(72, size * 2) })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Render an arbitrary SVG buffer to a PNG buffer at a given size (square). */
async function renderSvgPng(size, svgBuffer) {
  return sharp(svgBuffer, { density: Math.max(72, size * 2) })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writePngFromMark(size, outPath, svgBuffer) {
  const buf = await renderMarkPng(size, svgBuffer);
  await writeFile(outPath, buf);
  return buf;
}

/** Build a macOS .icns via the system `iconutil`. */
async function buildIcns(svgBuffer, outPath) {
  const iconset = resolve(TAURI_ICONS_DIR, "icon.iconset");
  await rm(iconset, { recursive: true, force: true });
  await mkdir(iconset, { recursive: true });

  // Required entries for iconutil
  const entries = [
    { name: "icon_16x16.png",      size: 16 },
    { name: "icon_16x16@2x.png",   size: 32 },
    { name: "icon_32x32.png",      size: 32 },
    { name: "icon_32x32@2x.png",   size: 64 },
    { name: "icon_128x128.png",    size: 128 },
    { name: "icon_128x128@2x.png", size: 256 },
    { name: "icon_256x256.png",    size: 256 },
    { name: "icon_256x256@2x.png", size: 512 },
    { name: "icon_512x512.png",    size: 512 },
    { name: "icon_512x512@2x.png", size: 1024 },
  ];

  for (const e of entries) {
    const buf = await renderMarkPng(e.size, svgBuffer);
    await writeFile(resolve(iconset, e.name), buf);
  }

  await rm(outPath, { force: true });
  await execFileAsync("iconutil", ["-c", "icns", iconset, "-o", outPath]);
  await rm(iconset, { recursive: true, force: true });
}

/** Build a multi-resolution Windows .ico. */
async function buildIco(svgBuffer, outPath) {
  const sizes = [16, 32, 48, 64, 128, 256];
  const buffers = await Promise.all(sizes.map((s) => renderMarkPng(s, svgBuffer)));
  const ico = await pngToIco(buffers);
  await writeFile(outPath, ico);
}

/** Build the OG social image (1200x630). */
async function buildOgImage(svgBuffer, outPath) {
  const W = 1200;
  const H = 630;

  // Gradient background
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7065ec"/>
          <stop offset="100%" stop-color="#5b4fd6"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
    </svg>`,
  );

  // White-only mark (no rounded square, just braces + lines in white).
  const whiteMark = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <g fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 90 64 C 82 64 76 70 76 80 L 76 116 C 76 124 70 128 62 128 C 70 128 76 132 76 140 L 76 176 C 76 186 82 192 90 192" stroke-width="14"/>
        <path d="M 166 64 C 174 64 180 70 180 80 L 180 116 C 180 124 186 128 194 128 C 186 128 180 132 180 140 L 180 176 C 180 186 174 192 166 192" stroke-width="14"/>
        <g stroke-width="10" opacity="0.95">
          <line x1="105" y1="104" x2="151" y2="104"/>
          <line x1="98"  y1="128" x2="158" y2="128"/>
          <line x1="111" y1="152" x2="145" y2="152"/>
        </g>
      </g>
    </svg>`,
  );

  // Render mark to a 360x360 PNG, place at left-center area.
  const markSize = 360;
  const markPng = await sharp(whiteMark, { density: 600 })
    .resize(markSize, markSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const padding = 80;
  const markLeft = padding;
  const markTop = Math.round((H - markSize) / 2);

  // Text overlay: title + slogan, vertically centered, to the right of the mark.
  const textLeft = markLeft + markSize + 56;
  const textW = W - textLeft - padding;
  const textSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${textW} ${H}">
      <g font-family='system-ui, -apple-system, "Inter", "Segoe UI", Roboto, sans-serif' fill="#ffffff">
        <text x="0" y="320" font-size="120" font-weight="800" letter-spacing="-2.4">Format Hub</text>
        <text x="0" y="400" font-size="42" font-weight="500" letter-spacing="-0.4" opacity="0.85">Code formatter for developers</text>
      </g>
    </svg>`,
  );
  const textPng = await sharp(textSvg, { density: 200 })
    .resize(textW, H, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(bg, { density: 200 })
    .resize(W, H)
    .composite([
      { input: markPng, left: markLeft, top: markTop },
      { input: textPng, left: textLeft, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  const svgBuffer = await readFile(MARK_SVG_PATH);

  // ------------------------------------------------------------
  // Web / Next.js App Router icons
  // ------------------------------------------------------------
  // src/app/icon.svg — copy of the mark
  await writeFile(resolve(APP_DIR, "icon.svg"), svgBuffer);

  // src/app/apple-icon.png — 180x180
  await writePngFromMark(180, resolve(APP_DIR, "apple-icon.png"), svgBuffer);

  // public/icon-192.png and icon-512.png (PWA)
  await writePngFromMark(192, resolve(PUBLIC_DIR, "icon-192.png"), svgBuffer);
  await writePngFromMark(512, resolve(PUBLIC_DIR, "icon-512.png"), svgBuffer);

  // public/favicon.ico (multi-size). Also mirror to src/app/favicon.ico because
  // Next.js App Router auto-detects src/app/favicon.ico and gives it priority.
  await buildIco(svgBuffer, resolve(PUBLIC_DIR, "favicon.ico"));
  await buildIco(svgBuffer, resolve(APP_DIR, "favicon.ico"));

  // ------------------------------------------------------------
  // Tauri icons (replace existing files in src-tauri/icons/)
  // ------------------------------------------------------------
  const tauriPngs = [
    ["32x32.png",              32],
    ["128x128.png",            128],
    ["128x128@2x.png",         256],
    ["icon.png",               1024],
    ["Square30x30Logo.png",    30],
    ["Square44x44Logo.png",    44],
    ["Square71x71Logo.png",    71],
    ["Square89x89Logo.png",    89],
    ["Square107x107Logo.png",  107],
    ["Square142x142Logo.png",  142],
    ["Square150x150Logo.png",  150],
    ["Square284x284Logo.png",  284],
    ["Square310x310Logo.png",  310],
    ["StoreLogo.png",          50],
  ];
  for (const [name, size] of tauriPngs) {
    await writePngFromMark(size, resolve(TAURI_ICONS_DIR, name), svgBuffer);
  }

  // .icns (macOS) and .ico (Windows)
  await buildIcns(svgBuffer, resolve(TAURI_ICONS_DIR, "icon.icns"));
  await buildIco(svgBuffer, resolve(TAURI_ICONS_DIR, "icon.ico"));

  // ------------------------------------------------------------
  // OG / social image
  // ------------------------------------------------------------
  await buildOgImage(svgBuffer, resolve(PUBLIC_DIR, "og-image.png"));

  console.log("[generate-icons] Done.");
}

main().catch((err) => {
  console.error("[generate-icons] Failed:", err);
  process.exit(1);
});
