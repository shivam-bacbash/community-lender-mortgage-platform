import { AIUnderwritingCard } from "@/components/loan/ai-underwriting-card";
import { UWEngineResultsCard } from "@/components/loan/uw-engine-results-card";
import { UWDecisionForm } from "@/components/loan/uw-decision-form";
import { Card } from "@/components/ui/card";
import { getStaffLoanWorkspace } from "@/lib/staff/queries";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";

export default async function StaffLoanUnderwritingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffLoanWorkspace(id);
  const latestDecision = workspace.underwritingDecisions[0] ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <UWEngineResultsCard workspace={workspace} />
        <AIUnderwritingCard workspace={workspace} />
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Latest decision</h2>
          {latestDecision ? (
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p className="font-medium capitalize text-gray-900">
                {latestDecision.decision.replaceAll("_", " ")}
              </p>
              <p>Decided at {formatDate(latestDecision.decided_at, "MMM d, yyyy h:mm a")}</p>
              <p>Approved amount: {formatCurrency(Number(latestDecision.approved_amount ?? 0))}</p>
              <p>DTI: {latestDecision.dti_ratio !== null ? formatPercent(latestDecision.dti_ratio) : "N/A"}</p>
              <p>LTV: {latestDecision.ltv_ratio !== null ? formatPercent(latestDecision.ltv_ratio) : "N/A"}</p>
              <p>Credit score used: {latestDecision.credit_score_used ?? "N/A"}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">No underwriting decision has been recorded yet.</p>
          )}
        </Card>
      </div>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Make decision</h2>
        <div className="mt-4">
          <UWDecisionForm workspace={workspace} />
        </div>
      </Card>
    </div>
  );
}
