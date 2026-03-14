"use client";

import { useEffect, useState, useTransition } from "react";

import { submitUWDecision } from "@/lib/actions/loans";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { StaffLoanWorkspace } from "@/types/staff";

function mapRecommendationToDecision(
  recommendation: "approve" | "approve_with_conditions" | "suspend" | "deny",
) {
  switch (recommendation) {
    case "approve":
      return "approved" as const;
    case "approve_with_conditions":
      return "approved_with_conditions" as const;
    case "suspend":
      return "suspended" as const;
    case "deny":
      return "denied" as const;
  }
}

export function UWDecisionForm({ workspace }: { workspace: StaffLoanWorkspace }) {
  const latestRiskAssessment =
    workspace.aiAnalyses.find(
      (analysis) => analysis.analysis_type === "risk_assessment" && analysis.status === "completed",
    )?.parsed_risk_assessment ?? null;
  const recommendedDecision = latestRiskAssessment
    ? mapRecommendationToDecision(latestRiskAssessment.recommendation)
    : "approved";
  const approvalBlocked = latestRiskAssessment ? !latestRiskAssessment.eligible_for_approval : false;
  const [decision, setDecision] = useState<"approved" | "approved_with_conditions" | "suspended" | "denied">("approved");
  const [approvedAmount, setApprovedAmount] = useState(String(workspace.header.loan_amount ?? ""));
  const [notes, setNotes] = useState("");
  const [denialReasons, setDenialReasons] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDecision(recommendedDecision);
  }, [recommendedDecision]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setServerError(null);

        startTransition(async () => {
          const result = await submitUWDecision(workspace.header.id, {
            decision,
            approved_amount: approvedAmount ? Number(approvedAmount) : undefined,
            notes,
            denial_reasons: denialReasons
              ? denialReasons.split(",").map((value) => Number(value.trim())).filter((value) => !Number.isNaN(value))
              : undefined,
          });

          if (result.error) {
            setServerError(result.error);
          }
        });
      }}
    >
      {serverError ? <Alert tone="error" message={serverError} /> : null}
      {latestRiskAssessment ? (
        <Alert
          tone={approvalBlocked ? "error" : "info"}
          title="Automated recommendation"
          message={
            approvalBlocked
              ? `Hard-stop failures found: ${latestRiskAssessment.hard_stop_failures.join(", ")}. Approval choices are disabled.`
              : `Suggested decision: ${latestRiskAssessment.recommendation.replaceAll("_", " ")}.`
          }
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="uwDecision" label="Decision" required>
          <Select id="uwDecision" value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
            <option value="approved" disabled={approvalBlocked}>Approved</option>
            <option value="approved_with_conditions" disabled={approvalBlocked}>Approved with conditions</option>
            <option value="suspended">Suspended</option>
            <option value="denied">Denied</option>
          </Select>
        </Field>
        <Field id="approvedAmount" label="Approved amount">
          <Input
            id="approvedAmount"
            type="number"
            value={approvedAmount}
            onChange={(event) => setApprovedAmount(event.target.value)}
          />
        </Field>
      </div>
      <Field id="uwNotes" label="Notes">
        <textarea
          id="uwNotes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="block min-h-28 w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm text-gray-900"
        />
      </Field>
      {decision === "denied" ? (
        <Field id="denialReasons" label="Denial reasons">
          <Input
            id="denialReasons"
            placeholder="Comma-separated numeric codes"
            value={denialReasons}
            onChange={(event) => setDenialReasons(event.target.value)}
          />
        </Field>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          Submit decision
        </Button>
      </div>
    </form>
  );
}
