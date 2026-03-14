"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveRateSheet } from "@/lib/actions/pricing";
import { FICO_BUCKETS, LTV_BUCKETS } from "@/lib/pricing/constants";
import type { PricingRateSheet } from "@/types/pricing";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CellDraft = {
  rate: string;
  points: string;
};

function getKey(ltv: number, fico: number) {
  return `ltv_${ltv}_fico_${fico}`;
}

export function RateMatrixEditor({
  productId,
  rateSheet,
}: {
  productId: string;
  rateSheet: PricingRateSheet | null;
}) {
  const router = useRouter();
  const initialCells = useMemo(() => {
    const rateData = (rateSheet?.rate_data ?? {}) as Record<string, { rate?: number; points?: number }>;
    return Object.fromEntries(
      LTV_BUCKETS.flatMap((ltv) =>
        FICO_BUCKETS.map((fico) => {
          const key = getKey(ltv, fico);
          const value = rateData[key] ?? {};
          return [
            key,
            {
              rate: value.rate !== undefined ? String(value.rate) : "",
              points: value.points !== undefined ? String(value.points) : "",
            } satisfies CellDraft,
          ] as const;
        }),
      ),
    ) as Record<string, CellDraft>;
  }, [rateSheet?.rate_data]);
  const [cells, setCells] = useState<Record<string, CellDraft>>(initialCells);
  const [effectiveDate, setEffectiveDate] = useState(rateSheet?.effective_date ?? new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(rateSheet?.expiry_date ?? "");
  const [margin, setMargin] = useState(String(rateSheet?.margin ?? 0.125));
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateCell(key: string, field: keyof CellDraft, value: string) {
    setCells((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
      },
    }));
  }

  function persist() {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      const rateData = Object.fromEntries(
        Object.entries(cells).map(([key, value]) => [
          key,
          {
            rate: Number(value.rate),
            points: Number(value.points || 0),
          },
        ]),
      );

      const result = await saveRateSheet({
        id: rateSheet?.id,
        loan_product_id: productId,
        effective_date: effectiveDate,
        expiry_date: expiryDate || undefined,
        margin: Number(margin),
        is_active: true,
        rate_data_json: JSON.stringify(rateData),
      });

      if (result.error) {
        setServerError(result.error);
        return;
      }

      setServerSuccess("Rate sheet saved.");
      router.refresh();
    });
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Rate matrix editor</h2>
          <p className="text-sm text-gray-600">Edit rate and points by LTV and FICO bucket.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} />
          <Input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
          <Input type="number" step="0.001" value={margin} onChange={(event) => setMargin(event.target.value)} placeholder="Margin" />
        </div>
      </div>

      {serverError ? <div className="mt-4"><Alert tone="error" message={serverError} /></div> : null}
      {serverSuccess ? <div className="mt-4"><Alert tone="success" message={serverSuccess} /></div> : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-25">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">LTV / FICO</th>
              {FICO_BUCKETS.map((fico) => (
                <th key={fico} className="px-4 py-3 text-left font-medium text-gray-500">
                  {fico}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {LTV_BUCKETS.map((ltv) => (
              <tr key={ltv}>
                <td className="px-4 py-3 font-medium text-gray-900">{ltv}%</td>
                {FICO_BUCKETS.map((fico) => {
                  const key = getKey(ltv, fico);
                  const cell = cells[key];
                  return (
                    <td key={key} className="px-4 py-3">
                      <div className="grid gap-2">
                        <Input
                          type="number"
                          step="0.001"
                          value={cell?.rate ?? ""}
                          onChange={(event) => updateCell(key, "rate", event.target.value)}
                          placeholder="Rate"
                        />
                        <Input
                          type="number"
                          step="0.001"
                          value={cell?.points ?? ""}
                          onChange={(event) => updateCell(key, "points", event.target.value)}
                          placeholder="Points"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <Button loading={isPending} onClick={persist}>
          Save matrix
        </Button>
      </div>
    </Card>
  );
}
