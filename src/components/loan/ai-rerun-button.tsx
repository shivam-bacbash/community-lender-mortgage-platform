"use client";

import { useState, useTransition } from "react";

import { rerunUnderwritingAnalysis } from "@/lib/actions/loans";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AIRerunButton({ loanId }: { loanId: string }) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        variant="secondary"
        loading={isPending}
        onClick={() => {
          setServerError(null);
          setSuccessMessage(null);
          startTransition(async () => {
            const result = await rerunUnderwritingAnalysis(loanId);

            if (result.error) {
              setServerError(result.error);
              return;
            }

            setSuccessMessage("A fresh underwriting summary is running now.");
          });
        }}
      >
        Re-run Analysis
      </Button>
      {serverError ? <Alert tone="error" message={serverError} /> : null}
      {successMessage ? <Alert tone="info" message={successMessage} /> : null}
    </div>
  );
}
