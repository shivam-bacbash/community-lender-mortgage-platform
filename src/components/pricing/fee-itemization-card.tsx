import { Card } from "@/components/ui/card";
import type { PricingFeeItem } from "@/types/pricing";
import { formatCurrency } from "@/lib/utils/format";

export function FeeItemizationCard({
  fees,
  totals,
}: {
  fees: PricingFeeItem[];
  totals: {
    bySection: Array<{ section: string; total: number }>;
    closingCosts: number;
    cashToClose: number;
  };
}) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900">Fee itemization</h2>
      <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <div className="space-y-3">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{fee.fee_name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Section {fee.disclosure_section ?? "Other"} • {fee.tolerance_bucket ?? "unlimited"}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(fee.amount, 2)}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-gray-25 p-4">
          <p className="text-sm font-semibold text-gray-900">Loan Estimate summary</p>
          <div className="mt-4 space-y-3 text-sm">
            {totals.bySection.map((section) => (
              <div key={section.section} className="flex items-center justify-between gap-3">
                <span className="text-gray-600">Section {section.section}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(section.total, 2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-600">Total closing costs</span>
                <span className="font-semibold text-gray-900">{formatCurrency(totals.closingCosts, 2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-gray-600">Cash to close</span>
                <span className="font-semibold text-gray-900">{formatCurrency(totals.cashToClose, 2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
