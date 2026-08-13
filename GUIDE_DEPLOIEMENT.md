# 🚀 Guide de Déploiement - AgroSphere

**Dernière mise à jour :** 2026-07-31  
**Version :** 1.0

---

## 📋 Prérequis

### Comptes requis
- [x] GitHub (dépôt privé/public)
- [x] Supabase (projet actif)
- [ ] Vercel OU Cloudflare Pages (choisir un)
- [x] Google Cloud (API Gemini)

### Variables d'environnement

Créer un fichier `.env` à la racine :

```bash
# Supabase
VITE_SUPABASE_URL=https://vtnduxtrnahhbgvlhqjw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash-preview-05-20

# Application
VITE_APP_URL=https://AgroSphere2.vercel.app
```

⚠️ **Ne jamais committer `.env`** — il est dans `.gitignore`

---

## 🅰️ Option A : Déploiement sur Vercel

### Étape 1 : Connecter le dépôt GitHub

1. Aller sur https://vercel.com/new
2. Importer le dépôt `Jean-kouassi/AgroSphere2`
3. Nom du projet : `AgroSphere2`
4. Framework : **TanStack Start** (détection auto)

### Étape 2 : Configurer les variables d'environnement

Dans **Settings → Environment Variables**, ajouter :

| Nom | Valeur | Environment |
|-----|--------|-------------|
| `VITE_SUPABASE_URL` | `https://vtnduxtrnahhbgvlhqjw.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | (clé anon Supabase) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | (clé service role) | Production uniquement |
| `GEMINI_API_KEY` | (clé API Google) | Production, Preview, Development |
| `GEMINI_MODEL` | `gemini-2.5-flash-preview-05-20` | Production, Preview, Development |
| `VITE_APP_URL` | `https://AgroSphere2.vercel.app` | Production |

### Étape 3 : Build Settings

Laisser Vercel détecter automatiquement :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

⚠️ **Ne pas utiliser `vercel.json`** — TanStack Start est auto-détecté

### Étape 4 : Déployer

```bash
cd C:\Users\Kouassi\Desktop\AgroSphere2
npx vercel --prod
```

### ⚠️ Problème connu : Statut UNKNOWN

**Symptôme :** Tous les déploiements affichent `UNKNOWN` avec durée `?` et 0 logs

**Cause :** Quota Hobby plan épuisé (100 builds/mois)

**Solutions :**

1. **Vérifier le quota :**
   - Dashboard Vercel → Settings → Billing → Usage
   - Si "Builds Used" ≥ 100 → quota atteint

2. **Attendre le reset :**
   - Le quota reset chaque mois à la date d'anniversaire du compte
   - Attendre ~3 semaines si on est en fin de cycle

3. **Upgrade vers Pro :**
   - $20/mois → builds illimités
   - https://vercel.com/pricing

4. **Migrer vers Cloudflare Pages (recommandé) :**
   - Gratuit, builds illimités
   - Déjà compatible avec Nitro
   - Voir section "Option B" ci-dessous

---

## 🅱️ Option B : Déploiement sur Cloudflare Pages

### Étape 1 : Installer Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### Étape 2 : Modifier `vite.config.ts`

Changer le preset Nitro :

```typescript
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    nitro({
      preset: 'cloudflare-pages' // ← Changer de 'node-server' à 'cloudflare-pages'
    }),
    // ... autres plugins
  ]
});
```

### Étape 3 : Build local

```bash
npm run build
```

Le output sera dans `.output/` avec structure Cloudflare-compatible.

### Étape 4 : Déployer

```bash
# Déploiement direct
npx wrangler pages deploy .output/public --project-name=AgroSphere2

# OU : connecter le dépôt GitHub pour déploiement auto
# 1. https://dash.cloudflare.com/?to=/:account/workers-and-pages/create
# 2. Choisir "Connect to Git"
# 3. Sélectionner le dépôt AgroSphere2
# 4. Build command: `npm run build`
# 5. Build output directory: `.output/public`
# 6. Variables d'environnement (mêmes que Vercel)
```

### Avantages Cloudflare vs Vercel

| Feature | Vercel Hobby | Cloudflare Pages |
|---------|--------------|------------------|
| Builds/mois | 100 | Illimité ✅ |
| Bandwidth | 100 GB | 100 GB |
| Storage | 1 GB | 5 GB ✅ |
| Functions | Serverless | Workers (Edge) ✅ |
| Prix | $0 ou $20/mois | $0 ✅ |

**Recommandation :** Cloudflare Pages pour projet gratuit avec builds fréquents

---

## 🔧 Configuration Supabase

### URLs de redirection OAuth

Après déploiement, configurer Supabase :

1. Dashboard → Authentication → URL Configuration
2. Remplir :

```
Site URL: https://AgroSphere2.vercel.app (ou .pages.dev)

Redirect URLs:
  - https://AgroSphere2.vercel.app/auth/callback
  - https://AgroSphere2.vercel.app/dashboard
  - https://AgroSphere2.pages.dev/auth/callback
  - https://AgroSphere2.pages.dev/dashboard
```

3. Sauvegarder

### Row Level Security (RLS)

Vérifier que RLS est activé sur toutes les tables :

```sql
-- Vérification
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Activer RLS sur une table
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Policy exemple : utilisateur voit seulement ses parcelles
CREATE POLICY "Users can view own parcels"
ON parcels FOR SELECT
USING (auth.uid() = user_id);
```

---

## 🧪 Tests post-déploiement

### Checklist de validation

- [ ] **Homepage** charge en <2s
- [ ] **Connexion Google** fonctionne (pas de redirect localhost)
- [ ] **Dashboard** affiche les données utilisateur
- [ ] **Parcelles** CRUD fonctionne (create, read, update, delete)
- [ ] **Diagnostic IA** retourne un résultat en <10s
- [ ] **Mode offline** fonctionne (activer mode avion → refresh)
- [ ] **PWA install prompt** apparaît après 30s
- [ ] **Bouton retour en haut** apparaît après scroll
- [ ] **Swipe horizontal** navigue entre les pages

### Commandes de test

```bash
# Test de performance (Lighthouse)
npm run build
npx vite preview
# Ouvrir Chrome DevTools → Lighthouse → Analyze

# Test offline
# 1. Ouvrir l'app
# 2. DevTools → Application → Service Workers → Toggle "Offline"
# 3. Refresh → l'app doit charger

# Test PWA install
# Mobile : attendre 30s → bannière "Installer AgroSphere" doit apparaître
```

---

## 🐛 Dépannage

### Build échoue avec "Cannot find module '@tanstack/start'"

```bash
# Nettoyer node_modules et rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Déploiement Vercel en UNKNOWN

Voir section "Problème connu : Statut UNKNOWN" ci-dessus.

### Erreurs TypeScript après ajout de tables

```bash
# Régénérer les types Supabase
npx supabase gen types typescript \
  --project-id vtnduxtrnahhbgvlhqjw \
  > src/integrations/supabase/types.ts
```

### Redirection OAuth vers localhost

1. Dashboard Supabase → Authentication → URL Configuration
2. Mettre à jour Site URL et Redirect URLs
3. Tester connexion incognito (cache navigateur)

### Service worker ne s'installe pas

1. DevTools → Application → Service Workers
2. Cliquer "Unregister" sur tous les SW existants
3. Clear storage (Application → Clear storage → Clear site data)
4. Refresh la page

---

## 📊 Monitoring post-déploiement

### Métriques à surveiller

| Métrique | Outil | Seuil alerte |
|----------|-------|--------------|
| Error rate | Sentry / Vercel Analytics | >1% |
| Page load time | Vercel Analytics | >3s |
| API response time | Supabase Logs | >500ms |
| Offline usage | Custom analytics | N/A |
| PWA installs | Custom analytics | Objectif : 50/jour |

### Logs à consulter

- **Vercel :** Dashboard → Deployments → [Deployment] → Logs
- **Supabase :** Dashboard → Database → Query Editor → `select * from audit_logs`
- **Cloudflare :** Dashboard → Workers & Pages → AgroSphere2 → Analytics

---

## 🔄 Mises à jour futures

### Procédure de déploiement

```bash
# 1. Tester en local
npm run build
npm run preview

# 2. Commit et push
git add -A
git commit -m "feat: description claire"
git push origin main

# 3. Vercel déploie automatiquement (si quota OK)
# 4. Cloudflare déploie automatiquement (si GitHub connected)

# 5. Vérifier le déploiement
npx vercel list
# OU
npx wrangler pages deployment list
```

### Rollback en cas de bug critique

**Vercel :**
1. Dashboard → Deployments
2. Trouver le dernier déploiement "Ready"
3. Menu (⋮) → "Promote to Production"

**Cloudflare :**
```bash
# Liste des déploiements
npx wrangler pages deployment list

# Rollback vers un déploiement spécifique
npx wrangler pages deployment rollback <deployment-id>
```

---

## 📞 Support

### Liens utiles
- **Docs Vercel :** https://vercel.com/docs
- **Docs Cloudflare Pages :** https://developers.cloudflare.com/pages/
- **Docs Supabase :** https://supabase.com/docs
- **Docs TanStack Start :** https://tanstack.com/start/latest/docs

### Contacts
- **Développeur :** Jean Kouassi (jeankouasst@gmail.com)
- **GitHub Issues :** https://github.com/Jean-kouassi/AgroSphere2/issues

---

*Guide maintenu à jour avec chaque déploiement majeur*
