#!/usr/bin/env bash
# Rejoue le dump sur un nouveau projet Supabase autonome.
# Usage :
#   export TARGET_DB_URL="postgres://postgres:<password>@db.<new-ref>.supabase.co:5432/postgres"
#   bash scripts/import-supabase.sh

set -euo pipefail

: "${TARGET_DB_URL:?Définis TARGET_DB_URL (URL Postgres du nouveau projet)}"

IN_DIR="${IN_DIR:-./supabase-export}"
[[ -f "$IN_DIR/01-schema.sql" ]] || { echo "Manque $IN_DIR/01-schema.sql — lance d'abord export-supabase.sh"; exit 1; }

echo "→ Extensions requises…"
psql "$TARGET_DB_URL" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;"
psql "$TARGET_DB_URL" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo "→ Import schema…"
psql "$TARGET_DB_URL" -f "$IN_DIR/01-schema.sql"

echo "→ Import données…"
psql "$TARGET_DB_URL" -f "$IN_DIR/02-data.sql"

echo "→ Bucket Storage 'agrofield-media'…"
psql "$TARGET_DB_URL" -c "INSERT INTO storage.buckets (id, name, public) VALUES ('agrofield-media', 'agrofield-media', false) ON CONFLICT (id) DO NOTHING;"

cat <<EOF

✅ Import terminé.

Étapes suivantes MANUELLES :
  1. Recréer les policies Storage dans le nouveau projet Supabase :
     Dashboard → Storage → agrofield-media → Policies (copier depuis l'ancien).
  2. Migrer les fichiers Storage :
       export SRC_URL=... SRC_SERVICE_KEY=...
       export DST_URL=... DST_SERVICE_KEY=...
       node scripts/migrate-storage.mjs
  3. Importer les comptes auth via Dashboard → Authentication → Users → Import
     (fichier $IN_DIR/03-auth-users.csv). Les mots de passe hachés bcrypt sont préservés.
  4. Mettre à jour VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY dans .env
     et redéployer.
EOF
