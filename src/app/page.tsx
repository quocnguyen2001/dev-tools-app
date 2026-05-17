import { FormatterPage } from "@/components/formatter/FormatterPage";
import { ApiError } from "@/lib/api/errors";
import { getPresets, getTypes } from "@/lib/api/formatter";
import type { FormatType, FormatTypeValue, Preset } from "@/types/formatter";

export const dynamic = "force-dynamic";

interface InitialData {
  types: FormatType[];
  type: FormatTypeValue;
  presets: Preset[];
  error?: string;
}

const FALLBACK_TYPES: FormatType[] = [
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "sql", label: "SQL" },
];

const FALLBACK_PRESETS: Preset[] = [{ value: "default", label: "Default" }];

async function loadInitialData(): Promise<InitialData> {
  try {
    const types = await getTypes({ cache: "no-store" });
    if (types.length === 0) {
      return {
        types: FALLBACK_TYPES,
        type: FALLBACK_TYPES[0].value,
        presets: FALLBACK_PRESETS,
        error: "Backend returned no format types. Using fallback list.",
      };
    }

    const initialType = types[0].value;
    const presets = await getPresets(initialType, { cache: "no-store" });
    return {
      types,
      type: initialType,
      presets: presets.length > 0 ? presets : FALLBACK_PRESETS,
    };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? `Failed to reach API (${err.code}): ${err.message}`
        : "Failed to reach API. Check NEXT_PUBLIC_API_BASE_URL and the backend.";
    return {
      types: FALLBACK_TYPES,
      type: FALLBACK_TYPES[0].value,
      presets: FALLBACK_PRESETS,
      error: message,
    };
  }
}

export default async function Home() {
  const { types, type, presets, error } = await loadInitialData();

  return (
    <FormatterPage
      initialTypes={types}
      initialType={type}
      initialPresets={presets}
      initialError={error}
    />
  );
}
