"use client";

import { useState, useTransition } from "react";

import { issueDisclosure } from "@/lib/actions/compliance";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function DisclosureActions({ loanId }: { loanId: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(disclosureType: "LE" | "CD") {
    setFeedback(null);
    setError(null);
    startTransition(async () => {
      const result = await issueDisclosure(loanId, disclosureType);
      if (result.error) {
        setError(result.error);
        return;
      }

      setFeedback(`${disclosureType} issued successfully.`);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button loading={isPending} onClick={() => run("LE")}>
          Issue Loan Estimate
        </Button>
        <Button variant="secondary" loading={isPending} onClick={() => run("CD")}>
          Issue Closing Disclosure
        </Button>
      </div>
      {feedback ? <Alert tone="success" message={feedback} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}
    </div>
  );
}
