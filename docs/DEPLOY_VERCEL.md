# Déploiement Vercel (préproduction)

## 1. Une fois — connexion
1. Crée un compte sur https://vercel.com et importe le repo GitHub (« Add New… → Project »).
2. Vercel détecte automatiquement le `vercel.json` — laisse tous les défauts.

## 2. Variables d'environnement
Dans **Project → Settings → Environment Variables**, ajoute :

| Nom | Valeur | Type |
|---|---|---|
| `SUPABASE_URL` | https://xxx.supabase.co | Plain |
| `SUPABASE_PUBLISHABLE_KEY` | sb_publishable_... | Plain |
| `SUPABASE_SERVICE_ROLE_KEY` | sb_secret_... | **Secret** |
| `VITE_SUPABASE_URL` | idem SUPABASE_URL | Plain |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | idem SUPABASE_PUBLISHABLE_KEY | Plain |
| `AI_PROVIDER` | `gemini` | Plain |
| `GEMINI_API_KEY` | AI... | **Secret** |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Plain |

## 3. Déploiement manuel
```bash
bun add -g vercel
vercel login
vercel --prod
```

## 4. Déploiement automatique (PR previews)
Ajoute le secret GitHub `VERCEL_TOKEN` (Settings → Secrets and variables → Actions).
Le workflow `.github/workflows/vercel-preview.yml` déploie chaque PR automatiquement.
