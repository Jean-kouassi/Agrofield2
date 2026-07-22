// Server-only helper for calling Lovable AI Gateway.
export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function getLovableApiKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY manquant");
  return key;
}
