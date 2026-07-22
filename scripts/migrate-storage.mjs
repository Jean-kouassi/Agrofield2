// Copie tous les objets du bucket "agrofield-media" d'un projet Supabase vers un autre.
// Usage :
//   export SRC_URL="https://old.supabase.co"     SRC_SERVICE_KEY="sb_secret_..."
//   export DST_URL="https://new.supabase.co"     DST_SERVICE_KEY="sb_secret_..."
//   node scripts/migrate-storage.mjs

import { createClient } from "@supabase/supabase-js";

const { SRC_URL, SRC_SERVICE_KEY, DST_URL, DST_SERVICE_KEY, BUCKET = "agrofield-media" } = process.env;
if (!SRC_URL || !SRC_SERVICE_KEY || !DST_URL || !DST_SERVICE_KEY) {
  console.error("Variables requises : SRC_URL, SRC_SERVICE_KEY, DST_URL, DST_SERVICE_KEY");
  process.exit(1);
}

const src = createClient(SRC_URL, SRC_SERVICE_KEY, { auth: { persistSession: false } });
const dst = createClient(DST_URL, DST_SERVICE_KEY, { auth: { persistSession: false } });

async function walk(prefix = "") {
  const { data, error } = await src.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      await walk(path); // dossier
    } else {
      const dl = await src.storage.from(BUCKET).download(path);
      if (dl.error) { console.warn("SKIP", path, dl.error.message); continue; }
      const up = await dst.storage.from(BUCKET).upload(path, dl.data, { upsert: true, contentType: dl.data.type });
      if (up.error) console.warn("FAIL", path, up.error.message);
      else console.log("OK  ", path);
    }
  }
}

await walk();
console.log("✅ Migration Storage terminée");
