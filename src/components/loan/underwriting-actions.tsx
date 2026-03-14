"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  pullMockCreditReport,
  runAutomatedUnderwriting,
} from "@/lib/actions/underwriting";

export function UnderwritingActions({ loanId }: { loanId: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: "credit" | "uw") {
    setServerError(null);
    setServerSuccess(null);

    startTransition(async () => {
      const result =
        action === "credit"
          ? await pullMockCreditReport(loanId)
          : await runAutomatedUnderwriting(loanId);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      setServerSuccess(
        action === "credit"
          ? "Mock credit report stored."
          : "Automated underwriting completed.",
      );
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" loading={isPending} onClick={() => runAction("credit")}>
          Pull mock credit
        </Button>
        <Button loading={isPending} onClick={() => runAction("uw")}>
          Run automated UW
        </Button>
      </div>
      {serverError ? <Alert tone="error" message={serverError} /> : null}
      {serverSuccess ? <Alert tone="success" message={serverSuccess} /> : null}
    </div>
  );
}
