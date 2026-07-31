// Fournisseur IA — Gemini direct uniquement (plus de Lovable Gateway).

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

export type ChatRequest = {
  messages: ChatMessage[];
  temperature?: number;
};

export type ChatResponse = { text: string };

// --- Gemini direct ---
// Doc: https://ai.google.dev/gemini-api/docs/text-generation
async function callGemini(req: ChatRequest): Promise<ChatResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY manquant");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  // Conversion messages OpenAI → Gemini
  const systemMessages = req.messages.filter((m) => m.role === "system");
  const nonSystem = req.messages.filter((m) => m.role !== "system");
  const contents = nonSystem.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: Array.isArray(m.content)
      ? m.content.map((p) =>
          p.type === "text"
            ? { text: p.text }
            : {
                inline_data: {
                  mime_type: extractMime(p.image_url.url),
                  data: extractBase64(p.image_url.url),
                },
              },
        )
      : [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (systemMessages.length) {
    body.system_instruction = {
      parts: systemMessages.flatMap((m) =>
        typeof m.content === "string" ? [{ text: m.content }] : m.content.filter((p) => p.type === "text"),
      ),
    };
  }
  if (req.temperature != null) body.generationConfig = { temperature: req.temperature };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Trop de requêtes Gemini — réessayez plus tard.");
  if (!res.ok) throw new Error(`Gemini indisponible: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return { text };
}

function extractMime(dataUrl: string): string {
  const m = /^data:([^;]+);base64,/.exec(dataUrl);
  return m?.[1] ?? "image/jpeg";
}
function extractBase64(dataUrl: string): string {
  const i = dataUrl.indexOf(",");
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

// --- API publique ---
export async function callChatAI(req: ChatRequest): Promise<ChatResponse> {
  return callGemini(req);
}