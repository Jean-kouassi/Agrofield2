# IA — Bascule vers Gemini direct

Le projet utilise déjà une abstraction (`src/lib/ai-provider.server.ts`) qui bascule entre :
- `AI_PROVIDER=lovable` — Lovable AI Gateway (par défaut tant qu'hébergé sur Lovable)
- `AI_PROVIDER=gemini` — Google Gemini API directe (après export)

## 1. Obtenir une clé Gemini
1. Aller sur https://aistudio.google.com/app/apikey
2. « Create API key » → copier la valeur (`AI...`)
3. Le plan gratuit inclut **~60 requêtes/min** sur `gemini-2.5-flash` — largement suffisant pour démarrer.

## 2. Configurer
Localement (`.env`) et en production (Vercel / Cloudflare) :
```
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash
```

## 3. Tester
```bash
GEMINI_API_KEY=AIza... node scripts/test-ai.mjs
```

## 4. Coûts (référence)
`gemini-2.5-flash` : ~0.075 $/M tokens en entrée, 0.30 $/M en sortie.
Une analyse de maladie (photo ~500 KB + prompt) coûte < 0.001 $.
