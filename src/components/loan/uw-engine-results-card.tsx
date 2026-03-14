import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { UnderwritingActions } from "@/components/loan/underwriting-actions";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";
import type { StaffLoanWorkspace } from "@/types/staff";

function latestRiskAssessment(workspace: StaffLoanWorkspace) {
  return workspace.aiAnalyses.find(
    (analysis) => analysis.analysis_type === "risk_assessment" && analysis.status === "completed",
  )?.parsed_risk_assessment ?? null;
}

function latestRiskAssessmentCreatedAt(workspace: StaffLoanWorkspace) {
  return (
    workspace.aiAnalyses.find(
      (analysis) => analysis.analysis_type === "risk_assessment" && analysis.status === "completed",
    )?.created_at ?? null
  );
}

function formatRuleName(ruleName: string) {
  return ruleName.replaceAll("_", " ");
}

function renderValue(value: number | string | null) {
  if (typeof value === "number") {
    if (value <= 1) {
      return formatPercent(value);
    }
    if (value >= 1000) {
      return formatCurrency(value);
    }
    return String(value);
  }

  return value ?? "N/A";
}

export function UWEngineResultsCard({ workspace }: { workspace: StaffLoanWorkspace }) {
  const riskAssessment = latestRiskAssessment(workspace);
  const createdAt = latestRiskAssessmentCreatedAt(workspace);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Automated underwriting</h2>
          <p className="text-sm text-gray-600">
            Rule-based eligibility checks using org-specific thresholds by loan type.
          </p>
        </div>
        <UnderwritingActions loanId={workspace.header.id} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-gray-25 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Credit score</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {workspace.latestCreditReport?.score ?? "Not pulled"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {workspace.latestCreditReport?.pulled_at
              ? `Pulled ${formatDate(workspace.latestCreditReport.pulled_at, "MMM d, yyyy h:mm a")}`
              : "Use the mock pull to generate a report"}
          </p>
        </div>
        <div className="rounded-2xl bg-gray-25 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">DTI</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {workspace.ratios.dti !== null ? formatPercent(workspace.ratios.dti) : "N/A"}
          </p>
        </div>
        <div className="rounded-2xl bg-gray-25 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">LTV</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {workspace.ratios.ltv !== null ? formatPercent(workspace.ratios.ltv) : "N/A"}
          </p>
        </div>
      </div>

      {riskAssessment ? (
        <div className="mt-6 space-y-4">
          {riskAssessment.eligible_for_approval ? (
            <Alert
              tone="success"
              title="Eligible for approval"
              message={`All hard-stop rules passed. Recommendation: ${riskAssessment.recommendation.replaceAll("_", " ")}.`}
            />
          ) : (
            <Alert
              tone="error"
              title="Cannot approve"
              message={`Hard-stop failures: ${riskAssessment.hard_stop_failures.map(formatRuleName).join(", ")}.`}
            />
          )}

          {riskAssessment.advisory_failures.length ? (
            <Alert
              tone="info"
              title="Advisory findings"
              message={riskAssessment.advisory_failures.map(formatRuleName).join(", ")}
            />
          ) : null}

          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <p>
              Recommendation:{" "}
              <span className="font-semibold capitalize text-gray-900">
                {riskAssessment.recommendation.replaceAll("_", " ")}
              </span>
            </p>
            <p>
              Reserves:{" "}
              <span className="font-semibold text-gray-900">
                {riskAssessment.values.months_reserves ?? "N/A"} months
              </span>
            </p>
            <p>
              Evaluated {createdAt ? formatDate(createdAt, "MMM d, yyyy h:mm a") : "recently"}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-25 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Rule</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Threshold</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {riskAssessment.results.map((result) => (
                  <tr key={result.rule_name}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{formatRuleName(result.rule_name)}</p>
                      {result.description ? (
                        <p className="mt-1 text-xs text-gray-500">{result.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{renderValue(result.actual_value)}</td>
                    <td className="px-4 py-3 text-gray-700">{result.threshold || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                          result.severity === "hard_stop"
                            ? "bg-error-50 text-error-700"
                            : "bg-warning-50 text-warning-700"
                        }`}
                      >
                        {result.severity.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                          result.passed ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"
                        }`}
                      >
                        {result.passed ? "Pass" : "Fail"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-gray-25 p-4">
          <p className="text-sm font-semibold text-gray-900">No automated evaluation yet</p>
          <p className="mt-1 text-sm text-gray-600">
            Pull a credit report if needed, then run the rule engine to generate eligibility results.
          </p>
        </div>
      )}
    </Card>
  );
}
