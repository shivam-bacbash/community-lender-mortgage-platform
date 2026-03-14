"use client";

import { useTransition, useState } from "react";

import { updateFundingChecklist } from "@/lib/actions/closing";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export const FUNDING_CHECKLIST_ITEMS = [
  "All conditions satisfied (PTD + PTC)",
  "Closing Disclosure acknowledged (3+ business days)",
  "All documents signed",
  "Wire instructions confirmed",
  "Hazard insurance bound",
  "Flood insurance bound (if required)",
  "Title commitment received",
  "Final inspection complete (construction only)",
] as const;

export function FundingChecklist({
  closingOrderId,
  checkedItems,
}: {
  closingOrderId: string;
  checkedItems: string[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set(checkedItems));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle(item: string) {
    const next = new Set(checked);
    if (next.has(item)) {
      next.delete(item);
    } else {
      next.add(item);
    }
    setChecked(next);

    const items = Array.from(next);
    startTransition(async () => {
      const res = await updateFundingChecklist(closingOrderId, items);
      if (res.error) {
        setError(res.error);
        // Revert on error
        setChecked(new Set(checked));
      } else {
        setError(null);
      }
    });
  }

  const checkedCount = checked.size;
  const totalCount = FUNDING_CHECKLIST_ITEMS.length;
  const allChecked = checkedCount === totalCount;

  return (
    <Card className="p-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Pre-funding checklist</h2>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              allChecked
                ? "bg-success-100 text-success-700"
                : "bg-gray-100 text-gray-600",
            )}
          >
            {checkedCount} / {totalCount}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          All items must be checked before marking the loan as funded.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="mt-4 space-y-2">
          {FUNDING_CHECKLIST_ITEMS.map((item) => {
            const isChecked = checked.has(item);
            return (
              <li key={item}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    isChecked
                      ? "border-success-200 bg-success-50"
                      : "border-gray-200 bg-white hover:bg-gray-50",
                    isPending && "pointer-events-none opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(item)}
                    disabled={isPending}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span
                    className={cn(
                      "text-sm",
                      isChecked ? "text-success-700 line-through" : "text-gray-700",
                    )}
                  >
                    {item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {error && (
          <p className="mt-3 rounded-lg bg-error-50 px-3 py-2 text-sm font-medium text-error-700">
            {error}
          </p>
        )}
        {allChecked && (
          <p className="mt-3 rounded-lg bg-success-50 px-3 py-2 text-sm font-medium text-success-700">
            All pre-funding items are complete. Ready to fund.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
