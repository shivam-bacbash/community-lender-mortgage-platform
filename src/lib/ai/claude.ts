import Anthropic from "@anthropic-ai/sdk";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function analyzeApplication(payload: object) {
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  return anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: JSON.stringify(payload) }],
  });
}
