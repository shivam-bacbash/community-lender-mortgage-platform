"use client";

import { useTransition, useState } from "react";

import { markFunded } from "@/lib/actions/closing";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MarkFundedButton({
  loanId,
  closingOrderId,
  allChecked,
  loanAmount,
}: {
  loanId: string;
  closingOrderId: string;
  allChecked: boolean;
  loanAmount: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [fundingAmount, setFundingAmount] = useState(
    loanAmount ? String(loanAmount) : "",
  );
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleMark() {
    const amount = parseFloat(fundingAmount);
    if (!fundingAmount || isNaN(amount) || amount <= 0) {
      setResult({ success: false, message: "Please enter a valid funding amount." });
      return;
    }

    startTransition(async () => {
      const res = await markFunded(loanId, closingOrderId, amount);
      if (res.error) {
        setResult({ success: false, message: res.error });
      } else {
        setResult({ success: true, message: "Loan has been marked as funded." });
        setShowForm(false);
      }
    });
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900">Fund the loan</h2>
      <p className="mt-1 text-sm text-gray-500">
        {allChecked
          ? "All pre-funding checklist items are complete. You may now mark this loan as funded."
          : "Complete all pre-funding checklist items before funding."}
      </p>

      {!showForm ? (
        <Button
          className="mt-4"
          onClick={() => setShowForm(true)}
          disabled={!allChecked || isPending}
        >
          Mark as funded
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Funding amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. 350000.00"
            />
          </div>

          {result && (
            <p
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                result.success
                  ? "bg-success-50 text-success-700"
                  : "bg-error-50 text-error-700",
              )}
            >
              {result.message}
            </p>
          )}

          <div className="flex gap-3">
            <Button onClick={handleMark} loading={isPending} variant="primary" size="sm">
              Confirm funding
            </Button>
            <Button
              onClick={() => {
                setShowForm(false);
                setResult(null);
              }}
              variant="secondary"
              size="sm"
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
