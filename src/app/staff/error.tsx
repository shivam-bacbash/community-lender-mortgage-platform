"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function StaffError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-4">
        <Alert tone="error" title="Staff view failed" message={error.message} />
        <Button variant="secondary" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
