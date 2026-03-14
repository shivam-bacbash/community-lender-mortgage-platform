import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import type { StaffLoanWorkspace } from "@/types/staff";

export function BorrowerFinancialSummary({ workspace }: { workspace: StaffLoanWorkspace }) {
  const totalAssets = workspace.assets.reduce((sum, asset) => sum + Number(asset.balance ?? 0), 0);
  const totalLiabilities = workspace.liabilities.reduce(
    (sum, liability) => sum + Number(liability.monthly_payment ?? 0),
    0,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">Borrower profile</h3>
        <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
          <p>Date of birth: {workspace.borrowerProfile?.dob ?? "N/A"}</p>
          <p>Citizenship: {workspace.borrowerProfile?.citizenship?.replaceAll("_", " ") ?? "N/A"}</p>
          <p>Marital status: {workspace.borrowerProfile?.marital_status ?? "N/A"}</p>
          <p>Dependents: {workspace.borrowerProfile?.dependents_count ?? 0}</p>
          <p>Housing status: {workspace.borrowerProfile?.housing_status?.replaceAll("_", " ") ?? "N/A"}</p>
          <p>Monthly housing payment: {formatCurrency(Number(workspace.borrowerProfile?.monthly_housing_payment ?? 0))}</p>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">Financial rollup</h3>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <p>Total assets: {formatCurrency(totalAssets)}</p>
          <p>Total monthly liabilities: {formatCurrency(totalLiabilities)}</p>
          <p>Credit score: {workspace.ratios.creditScore ?? "N/A"}</p>
        </div>
      </Card>
    </div>
  );
}
