import { z } from "zod";

import { AI_MODEL, callClaude } from "@/lib/ai/claude";
import { buildApplicationSnapshot, type ApplicationSnapshot } from "@/lib/ai/snapshot";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const prequalificationSchema = z.object({
  score: z.number().int().min(0).max(100),
  recommendation: z.enum(["likely_approve", "needs_review", "high_risk"]),
  strengths: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  flags: z.array(z.string()).default([]),
  rationale: z.string().max(500),
  estimated_dti: z.number(),
  estimated_ltv: z.number(),
});

const underwritingSchema = z.object({
  risk_score: z.number().int().min(0).max(100),
  recommendation: z.enum(["approve", "approve_with_conditions", "suspend", "deny"]),
  strengths: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  suggested_conditions: z.array(z.string()).default([]),
  key_ratios: z.object({
    dti: z.number(),
    ltv: z.number(),
    credit_score_adequacy: z.enum(["strong", "adequate", "marginal", "insufficient"]),
  }),
  executive_summary: z.string().max(1000),
});

const complianceSchema = z.object({
  compliance_status: z.enum(["clear", "review_required", "flag"]),
  issues: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      regulation: z.string(),
    }),
  ),
  trid_concerns: z.array(z.string()).default([]),
  fair_lending_notes: z.string().default(""),
});

function extractJson(text: string) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");

  if (objectStart === -1 || objectEnd === -1) {
    throw new Error("Claude did not return JSON.");
  }

  return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
}

async function storeAnalysis(params: {
  loanId: string;
  triggeredByProfile?: string | null;
  analysisType: "prequalification" | "underwriting_summary" | "compliance_check";
  snapshot: ApplicationSnapshot;
  result: object;
  confidenceScore?: number | null;
  tokensUsed?: number | null;
  latencyMs?: number | null;
  status?: "completed" | "failed";
  errorMessage?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_analyses")
    .insert({
      loan_application_id: params.loanId,
      analysis_type: params.analysisType,
      model_used: AI_MODEL,
      triggered_by: params.triggeredByProfile ? "manual" : "auto",
      triggered_by_profile: params.triggeredByProfile ?? null,
      input_snapshot: params.snapshot,
      result: params.result,
      confidence_score: params.confidenceScore ?? null,
      tokens_used: params.tokensUsed ?? null,
      latency_ms: params.latencyMs ?? null,
      status: params.status ?? "completed",
      error_message: params.errorMessage ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to store AI analysis.");
  }

  return data.id;
}

async function createFraudFlags(
  loanId: string,
  analysisId: string,
  flags: Array<{ flag_type: string; description: string; severity: "low" | "medium" | "high" | "critical"; evidence?: object }>,
) {
  if (!flags.length) {
    return;
  }

  const admin = createSupabaseAdminClient();
  await admin.from("fraud_flags").insert(
    flags.map((flag) => ({
      loan_application_id: loanId,
      ai_analysis_id: analysisId,
      flag_type: flag.flag_type,
      description: flag.description,
      severity: flag.severity,
      evidence: flag.evidence ?? {},
    })),
  );
}

export async function analyzePrequalification(
  loanId: string,
  triggeredByProfile?: string | null,
) {
  const snapshot = await buildApplicationSnapshot(loanId);

  try {
    const systemPrompt = `
You are a mortgage underwriting AI assistant for a community lender.
Analyze this loan application and return ONLY valid JSON with this exact structure:
{
  "score": <integer 0-100>,
  "recommendation": <"likely_approve" | "needs_review" | "high_risk">,
  "strengths": [<string>, <string>],
  "concerns": [<string>],
  "flags": [<string>],
  "rationale": <string max 150 words>,
  "estimated_dti": <number>,
  "estimated_ltv": <number>
}
Base your analysis on industry standard underwriting guidelines.
Be factual, concise, and fair. Do not discriminate based on protected classes.
Return only the JSON object, no markdown, no explanation.
`;

    const { text, tokensUsed, latencyMs } = await callClaude(
      systemPrompt,
      JSON.stringify(snapshot),
    );
    const result = prequalificationSchema.parse(extractJson(text));

    const analysisId = await storeAnalysis({
      loanId,
      triggeredByProfile,
      analysisType: "prequalification",
      snapshot,
      result,
      confidenceScore: result.score / 100,
      tokensUsed,
      latencyMs,
    });

    if (result.flags.length) {
      await createFraudFlags(
        loanId,
        analysisId,
        result.flags.map((flag) => ({
          flag_type: "other",
          description: flag,
          severity: "medium",
          evidence: { source: "prequalification" },
        })),
      );
    }

    return result;
  } catch (error) {
    await storeAnalysis({
      loanId,
      triggeredByProfile,
      analysisType: "prequalification",
      snapshot,
      result: {},
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function analyzeUnderwriting(
  loanId: string,
  triggeredByProfile?: string | null,
) {
  const snapshot = await buildApplicationSnapshot(loanId);

  try {
    const systemPrompt = `
You are a senior mortgage underwriter. Analyze this application and return ONLY valid JSON:
{
  "risk_score": <integer 0-100>,
  "recommendation": <"approve" | "approve_with_conditions" | "suspend" | "deny">,
  "strengths": [<string>, <string>, <string>],
  "concerns": [<string>, <string>],
  "suggested_conditions": [<string>],
  "key_ratios": {
    "dti": <number>,
    "ltv": <number>,
    "credit_score_adequacy": <"strong" | "adequate" | "marginal" | "insufficient">
  },
  "executive_summary": <string max 200 words>
}
This summary is for the loan officer's review, not the borrower.
Return only the JSON object.
`;

    const { text, tokensUsed, latencyMs } = await callClaude(
      systemPrompt,
      JSON.stringify(snapshot),
      1500,
    );
    const result = underwritingSchema.parse(extractJson(text));

    await storeAnalysis({
      loanId,
      triggeredByProfile,
      analysisType: "underwriting_summary",
      snapshot,
      result,
      confidenceScore: result.risk_score / 100,
      tokensUsed,
      latencyMs,
    });

    return result;
  } catch (error) {
    await storeAnalysis({
      loanId,
      triggeredByProfile,
      analysisType: "underwriting_summary",
      snapshot,
      result: {},
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function analyzeCompliance(
  loanId: string,
  triggeredByProfile?: string | null,
) {
  const snapshot = await buildApplicationSnapshot(loanId);

  try {
    const systemPrompt = `
You are a mortgage compliance officer. Check this application for regulatory concerns.
Return ONLY valid JSON:
{
  "compliance_status": <"clear" | "review_required" | "flag">,
  "issues": [
    {
      "type": <string>,
      "description": <string>,
      "severity": <"low" | "medium" | "high">,
      "regulation": <string>
    }
  ],
  "trid_concerns": [<string>],
  "fair_lending_notes": <string>
}
Check for: TRID timing requirements, QM eligibility, HOEPA triggers,
fair lending concerns, ATR compliance.
Return only the JSON object.
`;

    const { text, tokensUsed, latencyMs } = await callClaude(
      systemPrompt,
      JSON.stringify(snapshot),
    );
    const result = complianceSchema.parse(extractJson(text));

    const analysisId = await storeAnalysis({
      loanId,
      triggeredByProfile,
      analysisType: "compliance_check",
      snapshot,
      result,
      tokensUsed,
      latencyMs,
    });

    if (result.compliance_status === "flag" || result.issues.some((issue) => issue.severity === "high")) {
      await createFraudFlags(
        loanId,
        analysisId,
        result.issues.map((issue) => ({
          flag_type: "other",
          description: `${issue.type}: ${issue.description}`,
          severity: issue.severity === "high" ? "high" : issue.severity,
          evidence: { regulation: issue.regulation, source: "compliance_check" },
        })),
      );
    }

    return result;
  } catch (error) {
    await storeAnalysis({
      loanId,
      triggeredByProfile,
      analysisType: "compliance_check",
      snapshot,
      result: {},
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function runAutomaticAnalyses(
  loanId: string,
  triggeredByProfile?: string | null,
) {
  return Promise.allSettled([
    analyzePrequalification(loanId, triggeredByProfile),
    analyzeUnderwriting(loanId, triggeredByProfile),
    analyzeCompliance(loanId, triggeredByProfile),
  ]);
}
