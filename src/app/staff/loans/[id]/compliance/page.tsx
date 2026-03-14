import Link from "next/link";

import { parseComplianceCheckResult } from "@/lib/ai/results";
import { getStaffLoanComplianceWorkspace } from "@/lib/compliance/queries";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { DisclosureActions } from "@/components/compliance/disclosure-actions";
import { QMSummaryCard } from "@/components/compliance/qm-summary-card";
import { TRIDTracker } from "@/components/compliance/trid-tracker";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export default async function StaffLoanCompliancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanComplianceWorkspace(id);
  const aiCompliance = workspace.complianceAnalysis
    ? parseComplianceCheckResult(workspace.complianceAnalysis.result)
    : null;

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Loans", workspace.loan.loan_number ?? "Application", "Compliance"]}
        title="Compliance"
        subtitle="TRID deadlines, QM eligibility, HMDA capture, and audit activity for this file."
        actions={<DisclosureActions loanId={id} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <TRIDTracker milestones={workspace.trid.milestones} disclosures={workspace.trid.disclosures} />
          <QMSummaryCard qm={workspace.qm} />
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent audit trail</h2>
            <div className="mt-4 space-y-3">
              {workspace.recentAudit.length ? (
                workspace.recentAudit.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900">{entry.action.replaceAll(".", " ")}</p>
                      <p className="text-xs text-gray-500">{formatDate(entry.created_at, "MMM d, h:mm a")}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{entry.actor_name}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No compliance-relevant audit entries yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">HMDA snapshot</h2>
              <Link
                href="/admin/compliance"
                className={cn(
                  "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors",
                  "hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                Org compliance
              </Link>
            </div>
            {workspace.hmda ? (
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>Action taken: {workspace.hmda.action_taken ?? "N/A"}</p>
                <p>Action date: {workspace.hmda.action_taken_date ?? "N/A"}</p>
                <p>Census tract: {workspace.hmda.census_tract ?? "N/A"}</p>
                <p>Rate spread: {workspace.hmda.rate_spread ?? "N/A"}</p>
                <p>HOEPA status: {workspace.hmda.hoepa_status ?? "N/A"}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">
                HMDA will be captured automatically when this loan reaches a terminal disposition.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">AI compliance check</h2>
            {aiCompliance ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Status: {aiCompliance.compliance_status.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Last run {formatDate(workspace.complianceAnalysis?.created_at ?? new Date(), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                {aiCompliance.issues.length ? (
                  aiCompliance.issues.map((issue, index) => (
                    <div key={`${issue.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {issue.type} • {issue.regulation}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">{issue.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No AI compliance issues are currently flagged.</p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">No AI compliance analysis has been stored for this file yet.</p>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
