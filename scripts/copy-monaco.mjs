// Copy the Monaco editor "min/vs" bundle from node_modules into public/
// so that the AMD loader can pick it up offline. Without this step the app
// tries to fetch Monaco from cdn.jsdelivr.net at runtime, which fails inside
// Tauri (the production CSP blocks external script origins).

import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const source = resolve(projectRoot, "node_modules/monaco-editor/min/vs");
const target = resolve(projectRoot, "public/monaco-editor/vs");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(source))) {
    console.error(
      `[copy-monaco] Source not found: ${source}\n` +
        `Did you run "npm install"?`,
    );
    process.exit(1);
  }

  if (await exists(target)) {
    await rm(target, { recursive: true, force: true });
  }
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });

  console.log(`[copy-monaco] Copied Monaco assets to ${target}`);
}

main().catch((err) => {
  console.error("[copy-monaco] Failed:", err);
  process.exit(1);
});
