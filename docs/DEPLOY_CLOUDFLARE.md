# Déploiement Cloudflare Workers (production)

## 1. Prérequis
```bash
bun add -g wrangler
wrangler login
```

## 2. Secrets
Publie les secrets une fois pour toutes (ils ne sont **pas** dans `wrangler.toml`) :
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_PUBLISHABLE_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put GEMINI_API_KEY
```
Les variables non-sensibles (`AI_PROVIDER`, `GEMINI_MODEL`) sont déjà dans `[vars]` du `wrangler.toml`.

## 3. Build & deploy manuel
```bash
bash scripts/deploy-cf.sh
```

## 4. Déploiement continu (GitHub Actions)
Ajoute dans le repo GitHub → Settings → Secrets and variables → Actions :
- `CLOUDFLARE_API_TOKEN` (créé sur https://dash.cloudflare.com/profile/api-tokens avec le template "Edit Cloudflare Workers")
- `CLOUDFLARE_ACCOUNT_ID` (visible en haut à droite du dashboard Cloudflare)

Chaque push sur `main` déclenche `.github/workflows/cloudflare-deploy.yml`.

## 5. Domaine personnalisé
Cloudflare Dashboard → Workers & Pages → agrofield → Settings → Domains & Routes → Add custom domain.
