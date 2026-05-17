import { FormatterPage } from "@/components/formatter/FormatterPage";
import type { FormatType, Preset } from "@/types/formatter";

/**
 * The home route is a Server Component but it does not perform any
 * server-side fetching. The app ships as a fully static bundle (see
 * `next.config.ts` -> `output: "export"`) so the initial type/preset
 * lists are seeded from a hard-coded fallback. The client component
 * (`FormatterPage`) refreshes them on mount via `apiFetch`.
 */
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
