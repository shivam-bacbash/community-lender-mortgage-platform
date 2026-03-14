import { Card } from "@/components/ui/card";

import type { StaffLoanWorkspace } from "@/types/staff";

function latestPrequal(workspace: StaffLoanWorkspace) {
  return workspace.aiAnalyses.find((analysis) => analysis.analysis_type === "prequalification") ?? null;
}

export function AIAnalysisCard({ workspace }: { workspace: StaffLoanWorkspace }) {
  const analysis = latestPrequal(workspace);
  const result =
    analysis && typeof analysis.result === "object" && !Array.isArray(analysis.result)
      ? analysis.result
      : null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900">AI analysis</h3>
      {analysis ? (
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          {"recommendation" in (result ?? {}) ? (
            <p className="font-medium capitalize text-gray-900">
              Recommendation: {String((result as Record<string, unknown>).recommendation).replaceAll("_", " ")}
            </p>
          ) : null}
          {"raw" in (result ?? {}) ? <p>{String((result as Record<string, unknown>).raw)}</p> : null}
          <p className="text-gray-500">Confidence {analysis.confidence_score ?? "N/A"}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-600">
          No AI analysis is available for this loan yet.
        </p>
      )}
    </Card>
  );
}
