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

export interface DocumentExtractionResult {
  detected_type: string;
  confidence: number;
  extracted_fields: {
    borrower_name: string | null;
    date: string | null;
    employer_name: string | null;
    income_amount: number | null;
    period: string | null;
  };
  anomalies: string[];
}

export interface RiskAssessmentResult {
  loan_id: string;
  loan_type: string;
  recommendation: "approve" | "approve_with_conditions" | "suspend" | "deny";
  eligible_for_approval: boolean;
  hard_stop_failures: string[];
  advisory_failures: string[];
  values: {
    dti: number | null;
    ltv: number | null;
    cltv: number | null;
    credit_score: number | null;
    months_reserves: number | null;
    loan_amount: number | null;
  };
  results: Array<{
    rule_name: string;
    passed: boolean;
    actual_value: number | string | null;
    threshold: string;
    severity: "hard_stop" | "advisory";
    description: string | null;
  }>;
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

export function parseDocumentExtractionResult(result: Json): DocumentExtractionResult | null {
  if (!isRecord(result)) {
    return null;
  }

  if (
    typeof result.detected_type !== "string" ||
    typeof result.confidence !== "number" ||
    !isRecord(result.extracted_fields) ||
    !isStringArray(result.anomalies)
  ) {
    return null;
  }

  const extractedFields = result.extracted_fields;
  const stringOrNull = (value: Json | undefined) => value === null || typeof value === "string";
  const numberOrNull = (value: Json | undefined) => value === null || typeof value === "number";

  if (
    !stringOrNull(extractedFields.borrower_name) ||
    !stringOrNull(extractedFields.date) ||
    !stringOrNull(extractedFields.employer_name) ||
    !numberOrNull(extractedFields.income_amount) ||
    !stringOrNull(extractedFields.period)
  ) {
    return null;
  }

  return {
    detected_type: result.detected_type,
    confidence: result.confidence,
    extracted_fields: {
      borrower_name: extractedFields.borrower_name as string | null,
      date: extractedFields.date as string | null,
      employer_name: extractedFields.employer_name as string | null,
      income_amount: extractedFields.income_amount as number | null,
      period: extractedFields.period as string | null,
    },
    anomalies: result.anomalies,
  };
}

export function parseRiskAssessmentResult(result: Json): RiskAssessmentResult | null {
  if (!isRecord(result)) {
    return null;
  }

  if (
    typeof result.loan_id !== "string" ||
    typeof result.loan_type !== "string" ||
    typeof result.recommendation !== "string" ||
    typeof result.eligible_for_approval !== "boolean" ||
    !isStringArray(result.hard_stop_failures) ||
    !isStringArray(result.advisory_failures) ||
    !isRecord(result.values) ||
    !Array.isArray(result.results)
  ) {
    return null;
  }

  const values = result.values;
  const results = result.results;

  if (
    !["approve", "approve_with_conditions", "suspend", "deny"].includes(result.recommendation) ||
    ![values.dti, values.ltv, values.cltv, values.credit_score, values.months_reserves, values.loan_amount].every(
      (value) => value === null || typeof value === "number",
    ) ||
    !results.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof item.rule_name === "string" &&
        typeof item.passed === "boolean" &&
        (item.actual_value === null || typeof item.actual_value === "number" || typeof item.actual_value === "string") &&
        typeof item.threshold === "string" &&
        typeof item.severity === "string" &&
        (item.description === null || typeof item.description === "string") &&
        ["hard_stop", "advisory"].includes(item.severity),
    )
  ) {
    return null;
  }

  return {
    loan_id: result.loan_id,
    loan_type: result.loan_type,
    recommendation: result.recommendation as RiskAssessmentResult["recommendation"],
    eligible_for_approval: result.eligible_for_approval,
    hard_stop_failures: result.hard_stop_failures,
    advisory_failures: result.advisory_failures,
    values: {
      dti: values.dti as number | null,
      ltv: values.ltv as number | null,
      cltv: values.cltv as number | null,
      credit_score: values.credit_score as number | null,
      months_reserves: values.months_reserves as number | null,
      loan_amount: values.loan_amount as number | null,
    },
    results: results as RiskAssessmentResult["results"],
  };
}
