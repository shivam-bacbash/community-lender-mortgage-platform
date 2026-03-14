import Link from "next/link";

import { AIUnderwritingCard } from "@/components/loan/ai-underwriting-card";
import { LoanSummaryCard } from "@/components/loan/loan-summary-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";

export default async function StaffLoanOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanWorkspace(id);

  return (
    <div className="space-y-6">
      <LoanSummaryCard workspace={workspace} />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Property summary</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/staff/loans/${id}/underwriting`}
                  className={cn(
                    "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors",
                    "hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  Approve / Deny
                </Link>
                <Link
                  href={`/staff/loans/${id}/documents`}
                  className={cn(
                    "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors",
                    "hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  Request docs
                </Link>
                <Link
                  href="/staff/pipeline"
                  className={cn(
                    "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors",
                    "hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  Move stage
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
              <p>
                Address: {String((workspace.property?.address as { street?: string } | null)?.street ?? "N/A")}
              </p>
              <p>Type: {workspace.property?.property_type ?? "N/A"}</p>
              <p>
                Value:{" "}
                {workspace.property?.appraised_value || workspace.property?.estimated_value || workspace.property?.purchase_price
                  ? formatCurrency(
                      Number(
                        workspace.property?.appraised_value ??
                          workspace.property?.estimated_value ??
                          workspace.property?.purchase_price ??
                          0,
                      ),
                    )
                  : "N/A"}
              </p>
              <p>LTV: {workspace.ratios.ltv !== null ? formatPercent(workspace.ratios.ltv) : "N/A"}</p>
              <p>DTI: {workspace.ratios.dti !== null ? formatPercent(workspace.ratios.dti) : "N/A"}</p>
              <p>Credit score: {workspace.ratios.creditScore ?? "N/A"}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Stage history</h2>
            <div className="mt-4 space-y-3">
              {workspace.stageHistory.length ? (
                workspace.stageHistory.map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-gray-25 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{entry.action.replaceAll(".", " ")}</p>
                    <p className="mt-1 text-sm text-gray-600">{entry.actor_name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(entry.created_at, "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No stage activity logged yet.</p>
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <AIUnderwritingCard workspace={workspace} />
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Counts</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Conditions</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{workspace.counts.conditions}</p>
              </div>
              <div className="rounded-2xl bg-gray-25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Tasks</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{workspace.counts.tasks}</p>
              </div>
              <div className="rounded-2xl bg-gray-25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Documents</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{workspace.counts.documents}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
