// Vérifie que la clé Gemini fonctionne.
// Usage : GEMINI_API_KEY=... node scripts/test-ai.mjs

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("GEMINI_API_KEY manquant"); process.exit(1); }

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Dis bonjour en français en 5 mots." }] }] }),
});
if (!res.ok) { console.error("❌", res.status, await res.text()); process.exit(1); }
const j = await res.json();
console.log("✅ Réponse Gemini :", j.candidates?.[0]?.content?.parts?.[0]?.text);
