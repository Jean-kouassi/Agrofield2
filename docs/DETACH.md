# Détacher AgroField de Lovable

Procédure complète pour faire tourner le projet sur ta propre infra.

## 1. Exporter le code

```bash
# Dans Lovable : menu + → GitHub → Connect project
git clone git@github.com:<toi>/agrofield.git
cd agrofield
bun install
```

## 2. Retirer les résidus Lovable

```bash
# Supprimer les intégrations propriétaires
rm -rf src/integrations/lovable
rm src/lib/lovable-error-reporting.ts

# Retirer les dépendances Lovable
bun remove @lovable.dev/cloud-auth-js @lovable.dev/vite-tanstack-config
```

Remplacer `vite.config.ts` par :

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import nitro from "nitro/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    nitro({ config: { preset: "cloudflare-module" } }),
  ],
  server: { port: 8080, host: true },
});
```

Remplacer l'appel Google OAuth dans `src/routes/auth.tsx` :

```ts
import { supabase } from "@/integrations/supabase/client";
// ...
async function handleGoogle() {
  setLoading(true);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth` },
  });
  if (error) toast.error(error.message);
  setLoading(false);
}
```

## 3. Nouveau Supabase

Voir [`SUPABASE_MIGRATION.md`](./SUPABASE_MIGRATION.md).

## 4. Fichier `.env`

```bash
cp .env.example .env
# Remplir avec les valeurs de ton nouveau projet Supabase et ta clé Gemini
```

## 5. Test local

```bash
bun run dev
# http://localhost:8080
```

## 6. Déploiement

- **Vercel (préprod)** :
  ```bash
  bunx vercel link
  bunx vercel env pull
  bunx vercel --prod
  ```
- **Cloudflare Workers (prod)** :
  ```bash
  bunx wrangler login
  bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
  bunx wrangler secret put GEMINI_API_KEY
  bunx wrangler deploy
  ```

## 7. Android APK

Voir [`ANDROID_APK.md`](./ANDROID_APK.md).
