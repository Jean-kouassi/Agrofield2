# 🚀 Déploiement Agrofield2 sur Cloudflare Pages

## Prérequis

- Compte Cloudflare
- Node.js installé
- Projet buildé (`npm run build`)

---

## Option 1 : Via GitHub Actions (Recommandé)

### 1. Push le code sur GitHub

```bash
cd C:\Users\Kouassi\Desktop\Agrofield2
git add .
git commit -m "feat: Marketplace images + Swipe fluide + Navigation mobile"
git push origin main
```

### 2. Configurer Cloudflare Pages

1. Va sur https://dash.cloudflare.com/?to=/:account/pages
2. Clique **"Create a project"** → **"Connect to Git"**
3. Choisis ton repo `Agrofield2`
4. Configure :
   - **Framework preset** : `Vite`
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
   
5. **Environment Variables** (Settings → Environment Variables) :
   ```
   VITE_SUPABASE_URL=https://vtnduxtrnahhbgvlhqjw.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG... (ta clé depuis .env)
   ```

6. Clique **"Save and Deploy"**

### 3. Auto-deploy après chaque push

Cloudflare re-déploiera automatiquement à chaque `git push` !

---

## Option 2 : Via Wrangler CLI (Déploiement manuel)

### 1. Installer Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. Créer wrangler.toml

Crée un fichier `wrangler.toml` à la racine :

```toml
name = "agrofield2"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"
```

### 3. Déployer

```bash
# Build d'abord
npm run build

# Puis deploy
wrangler pages deploy dist --project-name=agrofield2
```

---

## ✅ Vérification Post-Déploiement

1. **URL du site** : Cloudflare te donne une URL du type `https://agrofield2.<random>.workers.dev`
2. **Teste les features** :
   - ✅ Swipe fluide entre pages (comme WhatsApp)
   - ✅ Images marketplace s'affichent correctement
   - ✅ Navigation mobile stable (pas de saut vers Finances)
   - ✅ Upload d'images dans `marketplace-images` bucket

3. **Domaine personnalisé** (optionnel) :
   - Va dans Cloudflare Pages → Ton projet → Custom domains
   - Ajoute `agrofield2.tondomaine.com`

---

## 🔧 Dépannage

### Build échoue sur Cloudflare

```
Error: No matching export found for "CreateOfferForm"
```

→ Vérifie que tous les imports sont corrects (minuscules/majuscules)
→ Teste localement : `npm run build` doit réussir

### Images ne s'affichent pas

→ Vérifie les environment variables (Supabase keys)
→ Ouvre la console (F12) et regarde les erreurs Network
→ Vérifie que le bucket `marketplace-images` est public

### Swipe ne fonctionne pas

→ Vérifie que tu es sur mobile ou mode responsive
→ Le swipe marche seulement depuis le bord gauche (50px)

---

## 📊 Suivi des Déploiements

Dans Cloudflare Dashboard → Pages → Ton projet :
- **Deployments** : Historique des déploiements
- **Analytics** : Traffic, performance
- **Settings** : Config, env vars, custom domains

---

**Prochain déploiement** : Juste un `git push` ! 🎉
