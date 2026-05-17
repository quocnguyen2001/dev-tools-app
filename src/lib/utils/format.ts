/**
 * Format a byte count using SI-style binary prefixes (1024-based).
 * Returns 1–2 decimal places where useful, otherwise an integer.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = value < 10 ? 2 : value < 100 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}
