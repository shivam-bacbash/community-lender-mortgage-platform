import type { Json } from "@/types/database";

export interface PrequalificationResult {
  score: number;
  recommendation: "likely_approve" | "needs_review" | "high_risk";
  strengths: string[];
  concerns: string[];
  flags: string[];
  rationale: string;
  estimated_dti: number;
  estimated_ltv: number;
}

export interface UnderwritingSummaryResult {
  risk_score: number;
  recommendation: "approve" | "approve_with_conditions" | "suspend" | "deny";
  strengths: string[];
  concerns: string[];
  suggested_conditions: string[];
  key_ratios: {
    dti: number;
    ltv: number;
    credit_score_adequacy: "strong" | "adequate" | "marginal" | "insufficient";
  };
  executive_summary: string;
}

export interface ComplianceCheckResult {
  compliance_status: "clear" | "review_required" | "flag";
  issues: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    regulation: string;
  }>;
  trid_concerns: string[];
  fair_lending_notes: string;
}

function isRecord(value: Json): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: Json | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parsePrequalificationResult(result: Json): PrequalificationResult | null {
  if (!isRecord(result)) {
    return null;
  }

  const { score, recommendation, rationale, estimated_dti, estimated_ltv } = result;

  if (
    typeof score !== "number" ||
    typeof recommendation !== "string" ||
    typeof rationale !== "string" ||
    typeof estimated_dti !== "number" ||
    typeof estimated_ltv !== "number"
  ) {
    return null;
  }

  if (!isStringArray(result.strengths) || !isStringArray(result.concerns) || !isStringArray(result.flags)) {
    return null;
  }

  if (!["likely_approve", "needs_review", "high_risk"].includes(recommendation)) {
    return null;
  }

  return {
    score,
    recommendation: recommendation as PrequalificationResult["recommendation"],
    strengths: result.strengths,
    concerns: result.concerns,
    flags: result.flags,
    rationale,
    estimated_dti,
    estimated_ltv,
  };
}

export function parseUnderwritingSummaryResult(result: Json): UnderwritingSummaryResult | null {
  if (!isRecord(result)) {
    return null;
  }

  const { risk_score, recommendation, executive_summary, key_ratios } = result;

  if (
    typeof risk_score !== "number" ||
    typeof recommendation !== "string" ||
    typeof executive_summary !== "string" ||
    !isRecord(key_ratios) ||
    typeof key_ratios.dti !== "number" ||
    typeof key_ratios.ltv !== "number" ||
    typeof key_ratios.credit_score_adequacy !== "string"
  ) {
    return null;
  }

  if (
    !isStringArray(result.strengths) ||
    !isStringArray(result.concerns) ||
    !isStringArray(result.suggested_conditions)
  ) {
    return null;
  }

  if (!["approve", "approve_with_conditions", "suspend", "deny"].includes(recommendation)) {
    return null;
  }

  if (
    !["strong", "adequate", "marginal", "insufficient"].includes(
      key_ratios.credit_score_adequacy,
    )
  ) {
    return null;
  }

  return {
    risk_score,
    recommendation: recommendation as UnderwritingSummaryResult["recommendation"],
    strengths: result.strengths,
    concerns: result.concerns,
    suggested_conditions: result.suggested_conditions,
    key_ratios: {
      dti: key_ratios.dti,
      ltv: key_ratios.ltv,
      credit_score_adequacy: key_ratios.credit_score_adequacy as UnderwritingSummaryResult["key_ratios"]["credit_score_adequacy"],
    },
    executive_summary,
  };
}

export function parseComplianceCheckResult(result: Json): ComplianceCheckResult | null {
  if (!isRecord(result) || typeof result.compliance_status !== "string" || !isStringArray(result.trid_concerns)) {
    return null;
  }

  if (!["clear", "review_required", "flag"].includes(result.compliance_status)) {
    return null;
  }

  const issues = result.issues;
  if (
    !Array.isArray(issues) ||
    !issues.every(
      (issue) =>
        issue &&
        typeof issue === "object" &&
        !Array.isArray(issue) &&
        typeof issue.type === "string" &&
        typeof issue.description === "string" &&
        typeof issue.severity === "string" &&
        typeof issue.regulation === "string",
    )
  ) {
    return null;
  }

  if (typeof result.fair_lending_notes !== "string") {
    return null;
  }

  return {
    compliance_status: result.compliance_status as ComplianceCheckResult["compliance_status"],
    issues: issues as ComplianceCheckResult["issues"],
    trid_concerns: result.trid_concerns,
    fair_lending_notes: result.fair_lending_notes,
  };
}
