#!/usr/bin/env bash
# Export du projet Supabase actuel (schéma + données) vers un dump SQL portable.
# Usage :
#   export SUPABASE_DB_URL="postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
#   bash scripts/export-supabase.sh
#
# Le dump exclut les schémas Supabase-internes (auth, storage, realtime, etc.)
# → il ne recopie QUE ton schéma applicatif (public). Les utilisateurs auth et
# les objets Storage sont migrés séparément (voir migrate-storage.mjs et le doc).

set -euo pipefail

: "${SUPABASE_DB_URL:?Définis SUPABASE_DB_URL (URL Postgres du projet source)}"

OUT_DIR="${OUT_DIR:-./supabase-export}"
mkdir -p "$OUT_DIR"

echo "→ Export schema (public)…"
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --schema-only \
  --no-owner --no-privileges \
  --file "$OUT_DIR/01-schema.sql"

echo "→ Export données (public)…"
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --data-only \
  --no-owner --no-privileges \
  --disable-triggers \
  --file "$OUT_DIR/02-data.sql"

echo "→ Export auth.users (uniquement l'essentiel pour recréer les comptes)…"
psql "$SUPABASE_DB_URL" -c "\COPY (SELECT id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at FROM auth.users) TO STDOUT WITH CSV HEADER" \
  > "$OUT_DIR/03-auth-users.csv"

echo "✅ Export terminé : $OUT_DIR"
ls -lh "$OUT_DIR"
