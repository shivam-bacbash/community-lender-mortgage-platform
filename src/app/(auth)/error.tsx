"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AuthError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className="w-full max-w-md p-8">
      <Alert tone="error" title="Authentication error" message={error.message} />
      <Button className="mt-4" variant="secondary" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
