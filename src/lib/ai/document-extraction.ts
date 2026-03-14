import { z } from "zod";

import { AI_MODEL, callClaude } from "@/lib/ai/claude";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const documentExtractionSchema = z.object({
  detected_type: z.string(),
  confidence: z.number().min(0).max(1),
  extracted_fields: z.object({
    borrower_name: z.string().nullable(),
    date: z.string().nullable(),
    employer_name: z.string().nullable(),
    income_amount: z.number().nullable(),
    period: z.string().nullable(),
  }),
  anomalies: z.array(z.string()).default([]),
});

function extractJson(text: string) {
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");

  if (objectStart === -1 || objectEnd === -1) {
    throw new Error("The AI provider did not return JSON.");
  }

  return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
}

export async function analyzeDocumentUpload(params: {
  documentId: string;
  loanId: string;
  triggeredByProfile: string;
  requestedType: string;
  fileName: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  checksum: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const snapshot = {
    requested_type: params.requestedType,
    file_name: params.fileName,
    mime_type: params.mimeType,
    file_size_bytes: params.fileSizeBytes,
    checksum_prefix: params.checksum ? params.checksum.slice(0, 12) : null,
  };

  try {
    const systemPrompt = `
You are a mortgage document classifier. Analyze the document description and metadata.
Return ONLY valid JSON:
{
  "detected_type": <document_type string>,
  "confidence": <0.0-1.0>,
  "extracted_fields": {
    "borrower_name": <string|null>,
    "date": <string|null>,
    "employer_name": <string|null>,
    "income_amount": <number|null>,
    "period": <string|null>
  },
  "anomalies": [<string>]
}
Return only the JSON object.
`;

    const { text, tokensUsed, latencyMs } = await callClaude(
      systemPrompt,
      JSON.stringify(snapshot),
      800,
    );

    const result = documentExtractionSchema.parse(extractJson(text));

    const { error: insertError } = await admin.from("ai_analyses").insert({
      loan_application_id: params.loanId,
      triggered_by_profile: params.triggeredByProfile,
      analysis_type: "document_extraction",
      model_used: AI_MODEL,
      triggered_by: "auto",
      input_snapshot: snapshot,
      result,
      confidence_score: result.confidence,
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
      status: "completed",
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    const { error: updateError } = await admin
      .from("documents")
      .update({
        ai_extracted_data: result,
        ai_classified_at: new Date().toISOString(),
      })
      .eq("id", params.documentId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return result;
  } catch (error) {
    await admin.from("ai_analyses").insert({
      loan_application_id: params.loanId,
      triggered_by_profile: params.triggeredByProfile,
      analysis_type: "document_extraction",
      model_used: AI_MODEL,
      triggered_by: "auto",
      input_snapshot: snapshot,
      result: {},
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}
