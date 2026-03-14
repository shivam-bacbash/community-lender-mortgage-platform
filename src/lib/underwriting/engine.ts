import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildApplicationSnapshot } from "@/lib/ai/snapshot";
import { AI_MODEL } from "@/lib/ai/claude";
import {
  DEFAULT_UNDERWRITING_RULES,
  HARD_STOP_RULE_NAMES,
} from "@/lib/underwriting/constants";

export interface UWRule {
  id: string;
  organization_id: string;
  loan_type: string;
  rule_name: string;
  rule_config: { min?: number; max?: number; values?: string[] };
  is_active: boolean;
  priority: number;
  description: string | null;
}

export interface UWResult {
  rule_name: string;
  passed: boolean;
  actual_value: number | string | null;
  threshold: string;
  severity: "hard_stop" | "advisory";
  description: string | null;
}

export interface UnderwritingComputedValues {
  dti: number | null;
  ltv: number | null;
  cltv: number | null;
  credit_score: number | null;
  months_reserves: number | null;
  loan_amount: number | null;
}

export interface UnderwritingEvaluation {
  loan_id: string;
  loan_type: string;
  recommendation: "approve" | "approve_with_conditions" | "suspend" | "deny";
  eligible_for_approval: boolean;
  hard_stop_failures: string[];
  advisory_failures: string[];
  values: UnderwritingComputedValues;
  results: UWResult[];
}

function formatThreshold(ruleConfig: UWRule["rule_config"]) {
  const parts = [];
  if (typeof ruleConfig.min === "number") {
    parts.push(`min: ${ruleConfig.min}`);
  }
  if (typeof ruleConfig.max === "number") {
    parts.push(`max: ${ruleConfig.max}`);
  }
  if (ruleConfig.values?.length) {
    parts.push(`values: ${ruleConfig.values.join(", ")}`);
  }
  return parts.join(" · ");
}

function mapRuleNameToValue(
  ruleName: string,
  values: UnderwritingComputedValues,
) {
  switch (ruleName) {
    case "min_credit_score":
      return values.credit_score;
    case "max_dti":
      return values.dti;
    case "max_ltv":
      return values.ltv;
    case "min_months_reserves":
      return values.months_reserves;
    case "max_loan_amount":
      return values.loan_amount;
    case "max_cltv":
      return values.cltv;
    default:
      return null;
  }
}

export function evaluateRule(
  rule: UWRule,
  values: UnderwritingComputedValues,
): UWResult {
  const value = mapRuleNameToValue(rule.rule_name, values);
  const minPass = typeof rule.rule_config.min === "number" ? value !== null && Number(value) >= rule.rule_config.min : true;
  const maxPass = typeof rule.rule_config.max === "number" ? value !== null && Number(value) <= rule.rule_config.max : true;
  const valuesPass = rule.rule_config.values?.length
    ? typeof value === "string" && rule.rule_config.values.includes(value)
    : true;

  return {
    rule_name: rule.rule_name,
    passed: Boolean(minPass && maxPass && valuesPass),
    actual_value: value,
    threshold: formatThreshold(rule.rule_config),
    severity: HARD_STOP_RULE_NAMES.includes(rule.rule_name as (typeof HARD_STOP_RULE_NAMES)[number])
      ? "hard_stop"
      : "advisory",
    description: rule.description,
  };
}

export async function ensureDefaultUnderwritingRules(organizationId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error: countError } = await admin
    .from("underwriting_rules")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error } = await admin.from("underwriting_rules").insert(
    DEFAULT_UNDERWRITING_RULES.map((rule) => ({
      organization_id: organizationId,
      loan_type: rule.loan_type,
      rule_name: rule.rule_name,
      rule_config: rule.rule_config,
      is_active: true,
      priority: rule.priority,
      description: rule.description,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchRules(
  organizationId: string,
  loanType: string,
): Promise<UWRule[]> {
  await ensureDefaultUnderwritingRules(organizationId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("underwriting_rules")
    .select("id, organization_id, loan_type, rule_name, rule_config, is_active, priority, description")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .in("loan_type", [loanType, "all"])
    .is("deleted_at", null)
    .order("priority", { ascending: true })
    .order("rule_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as UWRule[];
}

export async function computeLoanValues(
  loanId: string,
): Promise<{ loanType: string; values: UnderwritingComputedValues; snapshot: Awaited<ReturnType<typeof buildApplicationSnapshot>> }> {
  const snapshot = await buildApplicationSnapshot(loanId);

  return {
    loanType: snapshot.loan.type,
    snapshot,
    values: {
      dti: snapshot.loan.estimated_dti / 100,
      ltv: snapshot.loan.ltv / 100,
      cltv: snapshot.loan.ltv / 100,
      credit_score: snapshot.borrower.credit_score,
      months_reserves: snapshot.borrower.months_reserves,
      loan_amount: snapshot.loan.amount,
    },
  };
}

function summarizeRecommendation(results: UWResult[]): UnderwritingEvaluation["recommendation"] {
  if (results.some((result) => result.actual_value === null)) {
    return "suspend";
  }

  const hardStopFailures = results.filter((result) => result.severity === "hard_stop" && !result.passed);
  if (hardStopFailures.length) {
    return "deny";
  }

  const advisoryFailures = results.filter((result) => result.severity === "advisory" && !result.passed);
  return advisoryFailures.length ? "approve_with_conditions" : "approve";
}

export async function evaluateLoan(
  loanId: string,
  organizationId: string,
): Promise<UnderwritingEvaluation> {
  const computed = await computeLoanValues(loanId);
  const rules = await fetchRules(organizationId, computed.loanType);
  const { loanType, values } = computed;
  const results = rules.map((rule) => evaluateRule(rule, values));
  const recommendation = summarizeRecommendation(results);
  const hardStopFailures = results.filter((result) => result.severity === "hard_stop" && !result.passed);
  const advisoryFailures = results.filter((result) => result.severity === "advisory" && !result.passed);

  return {
    loan_id: loanId,
    loan_type: loanType,
    recommendation,
    eligible_for_approval: hardStopFailures.length === 0,
    hard_stop_failures: hardStopFailures.map((result) => result.rule_name),
    advisory_failures: advisoryFailures.map((result) => result.rule_name),
    values,
    results,
  };
}

export async function storeUnderwritingEvaluation(params: {
  loanId: string;
  triggeredByProfile: string;
  snapshot: object;
  evaluation: UnderwritingEvaluation;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("ai_analyses").insert({
    loan_application_id: params.loanId,
    triggered_by_profile: params.triggeredByProfile,
    analysis_type: "risk_assessment",
    model_used: `${AI_MODEL}-rules`,
    triggered_by: "manual",
    input_snapshot: params.snapshot,
    result: params.evaluation,
    confidence_score: params.evaluation.eligible_for_approval ? 0.9 : 0.75,
    status: "completed",
  });

  if (error) {
    throw new Error(error.message);
  }
}
