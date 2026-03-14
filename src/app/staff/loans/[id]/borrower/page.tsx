import { BorrowerFinancialSummary } from "@/components/loan/borrower-financial-summary";
import { Card } from "@/components/ui/card";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";
import { formatCurrency } from "@/lib/utils/format";

export default async function StaffLoanBorrowerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanWorkspace(id);

  return (
    <div className="space-y-6">
      <BorrowerFinancialSummary workspace={workspace} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Employment history</h2>
          <div className="mt-4 space-y-4">
            {workspace.employmentRecords.map((record) => (
              <div key={record.id} className="rounded-xl bg-gray-25 p-4">
                <p className="text-sm font-semibold text-gray-900">{record.employer_name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {record.position ?? "Position not set"} • {record.employment_type}
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Total income:{" "}
                  {formatCurrency(
                    Number(record.base_monthly_income ?? 0) +
                      Number(record.overtime_monthly ?? 0) +
                      Number(record.bonus_monthly ?? 0) +
                      Number(record.commission_monthly ?? 0) +
                      Number(record.other_monthly ?? 0),
                  )}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Declarations</h2>
          <pre className="mt-4 overflow-auto rounded-xl bg-gray-25 p-4 text-xs text-gray-700">
            {JSON.stringify(workspace.borrowerProfile?.declarations ?? {}, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  );
}
