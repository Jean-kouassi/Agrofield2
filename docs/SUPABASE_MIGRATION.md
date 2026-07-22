# Migration Supabase — Lovable Cloud → projet autonome

## 1. Créer le nouveau projet
1. Aller sur https://supabase.com/dashboard → New project.
2. Noter : URL du projet, `anon key` (= publishable), `service_role key`, mot de passe DB.
3. Récupérer l'URL Postgres complète dans **Settings → Database → Connection string → URI**.

## 2. Exporter l'ancien projet
```bash
# URL du projet SOURCE (Lovable Cloud). Demande à l'équipe Lovable si besoin.
export SUPABASE_DB_URL="postgres://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres"
bash scripts/export-supabase.sh
```
Génère `./supabase-export/` avec `01-schema.sql`, `02-data.sql`, `03-auth-users.csv`.

## 3. Importer dans le nouveau projet
```bash
export TARGET_DB_URL="postgres://postgres:<new-pwd>@db.<new-ref>.supabase.co:5432/postgres"
bash scripts/import-supabase.sh
```

## 4. Migrer le Storage (photos de reçus + analyses de maladies)
```bash
export SRC_URL="https://<old-ref>.supabase.co"  SRC_SERVICE_KEY="sb_secret_ANCIEN..."
export DST_URL="https://<new-ref>.supabase.co"  DST_SERVICE_KEY="sb_secret_NOUVEAU..."
node scripts/migrate-storage.mjs
```

## 5. Recréer les policies Storage
Dashboard nouveau projet → Storage → `agrofield-media` → Policies → recopier les 4 policies
existantes (INSERT/SELECT/UPDATE/DELETE avec `auth.uid()::text = (storage.foldername(name))[1]`).

## 6. Importer les utilisateurs auth
Dashboard → Authentication → Users → **Import users** → charger `03-auth-users.csv`.
Les mots de passe hachés bcrypt sont conservés — les utilisateurs se reconnectent normalement.

## 7. Basculer l'application
Mettre à jour `.env` (et les variables Vercel/Cloudflare) :
```
SUPABASE_URL=https://<new-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_NOUVEAU
SUPABASE_SERVICE_ROLE_KEY=sb_secret_NOUVEAU
VITE_SUPABASE_URL=https://<new-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NOUVEAU
```
Redéployer.

## 8. Vérifier
- Connexion utilisateur (existant) OK
- Liste parcelles / dépenses / ventes s'affiche
- Upload d'un nouveau reçu → visible dans le nouveau bucket
- Analyse maladie IA → renvoie un JSON

## 9. Décommissionner l'ancien
Une fois 100 % des flux validés pendant 48 h, désactiver Lovable Cloud.
