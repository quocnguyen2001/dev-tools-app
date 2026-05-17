"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface-0 p-8 text-text">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-center text-sm text-muted">
        {error.message || "An unexpected error occurred while loading the page."}
      </p>
      <Button variant="primary" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
