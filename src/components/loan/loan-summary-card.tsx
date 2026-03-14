import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { StaffLoanWorkspace } from "@/types/staff";

export function LoanSummaryCard({ workspace }: { workspace: StaffLoanWorkspace }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">
              {workspace.header.loan_number ?? "Loan application"}
            </h2>
            <StatusBadge status={workspace.header.status} />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {workspace.borrowerName} • {workspace.header.loan_type}{" "}
            {workspace.header.loan_purpose.replaceAll("_", " ")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-gray-25 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Loan amount</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {workspace.header.loan_amount ? formatCurrency(workspace.header.loan_amount) : "TBD"}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-25 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">DTI</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {workspace.ratios.dti !== null ? formatPercent(workspace.ratios.dti) : "N/A"}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-25 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">LTV</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {workspace.ratios.ltv !== null ? formatPercent(workspace.ratios.ltv) : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
