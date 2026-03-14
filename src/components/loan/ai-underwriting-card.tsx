import type { StaffLoanWorkspace } from "@/types/staff";
import { parseComplianceCheckResult } from "@/lib/ai/results";
import { formatDate, formatPercent } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";

import { AIRerunButton } from "@/components/loan/ai-rerun-button";

function latestUnderwriting(workspace: StaffLoanWorkspace) {
  return workspace.aiAnalyses.find(
    (analysis) => analysis.analysis_type === "underwriting_summary" && analysis.status === "completed",
  ) ?? null;
}

function latestCompliance(workspace: StaffLoanWorkspace) {
  return workspace.aiAnalyses.find(
    (analysis) => analysis.analysis_type === "compliance_check" && analysis.status === "completed",
  ) ?? null;
}

function latestUnderwritingFailure(workspace: StaffLoanWorkspace) {
  return workspace.aiAnalyses.find(
    (analysis) => analysis.analysis_type === "underwriting_summary" && analysis.status === "failed",
  ) ?? null;
}

function recommendationTone(recommendation: string) {
  switch (recommendation) {
    case "approve":
      return "bg-success-25 text-success-700";
    case "approve_with_conditions":
      return "bg-warning-25 text-warning-700";
    case "deny":
      return "bg-error-25 text-error-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function AIUnderwritingCard({ workspace }: { workspace: StaffLoanWorkspace }) {
  const underwriting = latestUnderwriting(workspace);
  const compliance = latestCompliance(workspace);
  const failedAttempt = latestUnderwritingFailure(workspace);
  const underwritingResult = underwriting?.parsed_underwriting ?? null;
  const underwritingCreatedAt = underwriting?.created_at ?? null;
  const complianceResult = compliance ? parseComplianceCheckResult(compliance.result) : null;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI underwriting summary</h3>
          <p className="text-sm text-gray-600">
            Internal AI assessment for the loan team. Review before making a decision.
          </p>
        </div>
        <AIRerunButton loanId={workspace.header.id} />
      </div>

      {underwritingResult ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="rounded-2xl bg-gray-25 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Risk score</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-gray-900">{underwritingResult.risk_score}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${recommendationTone(underwritingResult.recommendation)}`}
                >
                  {underwritingResult.recommendation.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {underwritingCreatedAt
                  ? `Generated ${formatDate(underwritingCreatedAt, "MMM d, yyyy h:mm a")}`
                  : "Generated recently"}
              </p>
            </div>

            <div className="rounded-2xl bg-primary-25 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-primary-700">Executive summary</p>
              <p className="mt-3 text-sm text-gray-700">{underwritingResult.executive_summary}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-25 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">DTI</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatPercent(underwritingResult.key_ratios.dti)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-25 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">LTV</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatPercent(underwritingResult.key_ratios.ltv)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-25 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Credit adequacy</p>
              <p className="mt-2 text-lg font-semibold capitalize text-gray-900">
                {underwritingResult.key_ratios.credit_score_adequacy}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-success-25 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-success-700">Strengths</p>
              <ul className="mt-3 space-y-2 text-sm text-success-900">
                {underwritingResult.strengths.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-warning-25 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-warning-700">Concerns</p>
              <ul className="mt-3 space-y-2 text-sm text-warning-900">
                {underwritingResult.concerns.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-25 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Suggested conditions</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {underwritingResult.suggested_conditions.length ? (
                underwritingResult.suggested_conditions.map((item) => <li key={item}>• {item}</li>)
              ) : (
                <li>No suggested conditions from AI.</li>
              )}
            </ul>
          </div>

          {complianceResult ? (
            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">Compliance check</p>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-700">
                  {complianceResult.compliance_status.replaceAll("_", " ")}
                </span>
              </div>
              {complianceResult.issues.length ? (
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {complianceResult.issues.map((issue) => (
                    <li key={`${issue.type}-${issue.description}`}>
                      • {issue.type}: {issue.description} ({issue.severity}, {issue.regulation})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-600">No compliance issues were flagged.</p>
              )}
            </div>
          ) : null}

          {failedAttempt &&
          underwritingCreatedAt &&
          new Date(failedAttempt.created_at).getTime() > new Date(underwritingCreatedAt).getTime() ? (
            <p className="text-sm text-warning-700">
              The latest re-run failed, so this card is showing the most recent completed analysis.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-gray-25 p-4">
          <p className="text-sm font-semibold text-gray-900">Analysis pending</p>
          <p className="mt-1 text-sm text-gray-600">
            The automatic underwriting summary will appear here after Claude finishes processing the file.
          </p>
          {failedAttempt?.error_message ? (
            <p className="mt-3 text-sm text-warning-700">
              The latest run failed. Use Re-run Analysis to generate a new summary.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}
