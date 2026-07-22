## Migration complète AgroField — hors Lovable

Objectif : livrer tout ce qui peut être fait côté code + docs pour couvrir les 4 phases en une passe. Ce qui exige tes credentials (nouveau projet Supabase, compte Vercel/Cloudflare, clé Gemini) reste manuel — je fournis les scripts et checklists prêts à jouer.

### 1. Export Supabase (nouveau projet autonome)
- `scripts/export-supabase.sh` : dump schema + données via `pg_dump` (URL source lue depuis `SUPABASE_DB_URL`).
- `scripts/import-supabase.sh` : rejoue le dump sur la nouvelle base + réactive `pgcrypto` + recrée le bucket `agrofield-media` + policies Storage.
- `scripts/migrate-storage.mjs` : recopie les objets Storage (receipts) de l'ancien projet vers le nouveau avec la Service Role Key.
- `docs/SUPABASE_MIGRATION.md` mis à jour : étapes exactes (créer projet, coller URL, lancer scripts, basculer `VITE_SUPABASE_*`).

### 2. IA — bascule Gemini direct
- Adapter `src/lib/ai-provider.server.ts` pour accepter `GEMINI_API_KEY` en plus / à la place de `LOVABLE_API_KEY`.
- Mettre à jour `analyze-plant.functions.ts` : format d'appel Gemini `gemini-2.5-flash` (vision) via REST (compatible workerd).
- Ajout d'un test rapide `scripts/test-ai.mjs` pour vérifier la clé.
- Doc `docs/AI_GEMINI.md` : comment obtenir la clé sur Google AI Studio, coût, quotas.

### 3. Déploiement Vercel (préprod)
- `vercel.json` finalisé : `buildCommand`, `outputDirectory`, `framework: null`, headers cache assets, rewrite SPA.
- `.github/workflows/vercel-preview.yml` : preview auto sur PR.
- `docs/DEPLOY_VERCEL.md` : variables d'env à saisir dans Vercel, commande `vercel --prod`.

### 4. Déploiement Cloudflare Workers (prod)
- `wrangler.toml` finalisé (compat_date, nodejs_compat, `[vars]` publics, `[[assets]]` binding).
- `scripts/deploy-cf.sh` : `bun run build && wrangler deploy`.
- `.github/workflows/cloudflare-deploy.yml` : deploy sur push `main`.
- `docs/DEPLOY_CLOUDFLARE.md` : `wrangler secret put` pour `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`.

### 5. Détails techniques (pour toi si tu veux vérifier)
- Aucun changement RLS / migration DB — le code reste compatible avec Supabase managé et Supabase auto-hébergé.
- Le provider IA lit `process.env.AI_PROVIDER` (`lovable` | `gemini`) — bascule sans rebuild logiciel.
- Les workflows GitHub utilisent des secrets à définir dans le repo : `VERCEL_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- Les scripts d'export utilisent `pg_dump`/`psql` officiels → aucune donnée ne transite par Lovable.

### Ce qui reste 100 % manuel de ton côté
1. Créer le nouveau projet Supabase et copier `DATABASE_URL` + `SERVICE_ROLE` dans les scripts.
2. Obtenir `GEMINI_API_KEY` sur https://aistudio.google.com.
3. Créer les comptes Vercel + Cloudflare, coller les tokens en secrets GitHub.
4. Lancer `bash scripts/export-supabase.sh` puis `bash scripts/import-supabase.sh`.
5. Basculer les `VITE_SUPABASE_*` du repo vers le nouveau projet.

Je livre tous les fichiers ci-dessus en une fois.
