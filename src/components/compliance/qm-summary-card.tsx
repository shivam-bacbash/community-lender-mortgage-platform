import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils/format";
import type { QMResult } from "@/types/compliance";

function formatQMValue(value: string | number | null) {
  if (typeof value === "number") {
    if (value > 0 && value < 1) {
      return formatPercent(value);
    }
    return value.toString();
  }

  return value ?? "N/A";
}

export function QMSummaryCard({ qm }: { qm: QMResult }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">QM eligibility</h2>
          <p className="mt-1 text-sm text-gray-500">Ability-to-repay and higher-priced mortgage checks.</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${qm.isQM ? "text-success-700" : "text-error-700"}`}>
            {qm.isQM ? "Qualified mortgage" : "Non-QM"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            HPML: {qm.isHPML ? "Yes" : "No"} • HOEPA: {qm.isHOEPA ? "Yes" : "No"}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {qm.checks.map((check) => (
          <div key={check.name} className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900">{check.name}</p>
              <span className={`text-xs font-semibold ${check.passed ? "text-success-700" : "text-error-700"}`}>
                {check.passed ? "Pass" : "Fail"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{formatQMValue(check.value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        APOR baseline: {qm.apor ?? "N/A"} • Rate spread: {qm.rateSpread?.toFixed(2) ?? "N/A"}
      </div>
    </Card>
  );
}
