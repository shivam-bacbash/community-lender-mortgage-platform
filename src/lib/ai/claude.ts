import OpenAI from "openai";

export const AI_MODEL = "gpt-5-mini";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024,
) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const startMs = Date.now();
  const response = await openai.responses.create({
    model: AI_MODEL,
    max_output_tokens: maxTokens,
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  return {
    text: response.output_text.trim(),
    tokensUsed:
      (response.usage?.input_tokens ?? 0) +
      (response.usage?.output_tokens ?? 0),
    latencyMs: Date.now() - startMs,
  };
}
