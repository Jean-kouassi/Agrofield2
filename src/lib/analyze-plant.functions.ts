import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  imageBase64: z.string().min(50), // data URL or raw base64
  mimeType: z.string().default("image/jpeg"),
  cropHint: z.string().optional(),
  parcelId: z.string().uuid().optional().nullable(),
});

type DiseaseResult = {
  disease_name: string;
  severity: "faible" | "moyen" | "critique" | "inconnu";
  confidence: string;
  treatment: string;
  prevention: string;
  is_plant: boolean;
  notes: string;
};

export const analyzePlantImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { callChatAI } = await import("./ai-provider.server");

    const dataUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:${data.mimeType};base64,${data.imageBase64}`;

    const systemPrompt = `Tu es un expert en pathologie végétale spécialisé dans les cultures d'Afrique de l'Ouest (mil, sorgho, maïs, coton, arachide, maraîchage). Tu analyses une photo de plante et retournes UNIQUEMENT un JSON strict, en français, sans texte autour, avec ces champs :
- is_plant (bool) : true si l'image contient une plante identifiable
- disease_name (string) : nom courant de la maladie ou "Aucune maladie détectée" ou "Non identifiable"
- severity : "faible" | "moyen" | "critique" | "inconnu"
- confidence : "faible" | "moyenne" | "élevée"
- treatment (string) : traitement recommandé, produits disponibles localement, courts pas à pas
- prevention (string) : conseils de prévention
- notes (string) : observations utiles pour l'agriculteur

Réponds en JSON pur, sans balises markdown.`;

    const userText = data.cropHint
      ? `Culture concernée : ${data.cropHint}. Analyse cette photo.`
      : "Analyse cette photo de plante.";

    const { text: raw } = await callChatAI({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed: DiseaseResult;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        is_plant: false,
        disease_name: "Non identifiable",
        severity: "inconnu",
        confidence: "faible",
        treatment: "Réessayez avec une photo plus nette de la feuille malade.",
        prevention: "",
        notes: raw.slice(0, 500),
      };
    }

    const { data: inserted, error } = await context.supabase
      .from("disease_analyses")
      .insert({
        user_id: context.userId,
        parcel_id: data.parcelId ?? null,
        disease_name: parsed.disease_name,
        severity: parsed.severity,
        confidence: parsed.confidence,
        treatment: parsed.treatment,
        prevention: parsed.prevention,
        raw_response: parsed as unknown as never,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { analysis: parsed, id: inserted.id as string };
  });
