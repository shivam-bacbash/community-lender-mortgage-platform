"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { lockRate, recalculateLoanPricing } from "@/lib/actions/pricing";
import type { ProductRateQuote, RateLockSummary } from "@/types/pricing";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function PricingResultsPanel({
  loanId,
  quotes,
  activeRateLock,
}: {
  loanId: string;
  quotes: ProductRateQuote[];
  activeRateLock: RateLockSummary | null;
}) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(quotes[0]?.product_id ?? "");
  const [lockPeriodDays, setLockPeriodDays] = useState("30");
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedQuote = useMemo(
    () => quotes.find((quote) => quote.product_id === selectedProductId) ?? quotes[0] ?? null,
    [quotes, selectedProductId],
  );

  function runRecalculate() {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      const result = await recalculateLoanPricing(loanId);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      setServerSuccess("Pricing refreshed.");
      router.refresh();
    });
  }

  function runLock() {
    if (!selectedQuote) {
      return;
    }

    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      const result = await lockRate({
        loanId,
        loanProductId: selectedQuote.product_id,
        rate: selectedQuote.rate,
        apr: selectedQuote.apr,
        points: selectedQuote.points,
        lockPeriodDays: Number(lockPeriodDays),
      });

      if (result.error) {
        setServerError(result.error);
        return;
      }

      setServerSuccess("Rate lock stored.");
      router.refresh();
    });
  }

  if (!quotes.length) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Rate results</h2>
        <p className="mt-3 text-sm text-gray-600">
          Pull credit and make sure the loan has a property value before running pricing.
        </p>
        <div className="mt-4">
          <Button variant="secondary" loading={isPending} onClick={runRecalculate}>
            Recalculate
          </Button>
        </div>
        {serverError ? <div className="mt-4"><Alert tone="error" message={serverError} /></div> : null}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Rate results</h2>
          <p className="text-sm text-gray-600">Choose a priced product and optionally lock the current rate.</p>
        </div>
        <Button variant="secondary" loading={isPending} onClick={runRecalculate}>
          Recalculate
        </Button>
      </div>

      {serverError ? <div className="mt-4"><Alert tone="error" message={serverError} /></div> : null}
      {serverSuccess ? <div className="mt-4"><Alert tone="success" message={serverSuccess} /></div> : null}

      <div className="mt-6 grid gap-3">
        {quotes.map((quote) => (
          <button
            key={quote.product_id}
            type="button"
            onClick={() => setSelectedProductId(quote.product_id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedQuote?.product_id === quote.product_id
                ? "border-primary-500 bg-primary-25"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{quote.product_name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {quote.term_months / 12} year term
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div>
                  <p className="text-gray-500">Rate</p>
                  <p className="font-semibold text-gray-900">{quote.rate}%</p>
                </div>
                <div>
                  <p className="text-gray-500">APR</p>
                  <p className="font-semibold text-gray-900">{quote.apr}%</p>
                </div>
                <div>
                  <p className="text-gray-500">P&amp;I</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(quote.monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Points</p>
                  <p className="font-semibold text-gray-900">{quote.points}</p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Rate lock</p>
          <p className="mt-1 text-sm text-gray-600">
            {activeRateLock
              ? `Active lock ${activeRateLock.rate}% expiring ${formatDate(activeRateLock.expires_at)}.`
              : "No active lock on file."}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-gray-600">
            Lock period
            <select
              className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              value={lockPeriodDays}
              onChange={(event) => setLockPeriodDays(event.target.value)}
            >
              <option value="15">15 days</option>
              <option value="30">30 days</option>
              <option value="45">45 days</option>
              <option value="60">60 days</option>
            </select>
          </label>
          <Button loading={isPending} onClick={runLock}>
            Lock rate
          </Button>
        </div>
      </div>
    </Card>
  );
}
