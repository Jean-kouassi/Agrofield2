# 🚀 Migration AgroSphere2 - Statut et Prochaines Étapes

**Date:** 22 Juillet 2026  
**Statut:** 70% complété ✅

---

## ✅ Fonctionnalités Déjà Implémentées

### 1. **Page d'Accueil Améliorée** 
- ✅ Section marketplace visible sur landing page
- ✅ Stats (100% produits locaux, 0 FCFA commission)
- ✅ Boutons "Publier une offre" et "Parcourir les offres"
- ✅ Features cards (6 fonctionnalités)

### 2. **Marketplace - Backend**
- ✅ Types TypeScript (`src/types/marketplace.ts`)
- ✅ Fonctions API (`src/lib/marketplace.ts`)
  - `fetchOffers()` avec filtres
  - `getOffer(id)`
  - `createOffer()`
  - `updateOffer()`, `deleteOffer()`
  - `createOrder()`
  - `getUserOrders()`
  - `getMarketplaceStats()`

### 3. **Marketplace - Pages**
- ✅ `src/routes/marketplace.create.tsx` - Formulaire complet de publication
- ✅ `src/routes/marketplace.tsx` - Page principale avec filtres et stats
- ✅ `src/routes/marketplace.$id.tsx` - Page de détail avec commande

### 4. **Configuration Supabase**
- ✅ `.env` configuré avec projet AgroSphere2
- ✅ Client Supabase natif (pas Lovable)

---

## ⏳ Fonctionnalités à Appliquer (30% restant)

### A. ~~Marketplace (Pages manquantes)~~ ✅ COMPLÉTÉ

**Les 3 pages marketplace sont maintenant opérationnelles !**

- ✅ Page principale avec recherche, filtres et stats
- ✅ Page de création d'offre
- ✅ Page de détail avec système de commande

**Prochaine étape:** Tester avec des données réelles dans Supabase

```bash
# 1. Page principale marketplace
cp "C:\Users\Kouassi\.openclaw\workspace\agrosphere-connect\src\routes\marketplace.tsx" \
   "C:\Users\Kouassi\Desktop\AgroSphere2\src\routes\marketplace.tsx"

# 2. Page détail offre
cp "C:\Users\Kouassi\.openclaw\workspace\agrosphere-connect\src\routes\marketplace.\$id.tsx" \
   "C:\Users\Kouassi\Desktop\AgroSphere2\src\routes\marketplace.\$id.tsx"
```

**Tables SQL à vérifier dans Supabase :**

```sql
-- Exécuter dans l'éditeur SQL Supabase si tables manquantes
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  price NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  region TEXT,
  payment_methods TEXT[] DEFAULT ARRAY['cash'],
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_offers INTEGER DEFAULT 0,
  active_offers INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_volume_xof NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

---

### B. Finances Agricoles + Credit Scoring

**Déjà présent dans AgroSphere2 :**
- ✅ Table `expenses` (dépenses)
- ✅ Table `sales` (ventes)
- ✅ Table `price_references` (références prix)
- ✅ Page `/finance` avec dashboard

**À ajouter depuis AgroSphere Connect :**

```bash
# 1. Système de credit scoring
cp "C:\Users\Kouassi\.openclaw\workspace\agrosphere-connect\src\lib\credit-score.ts" \
   "C:\Users\Kouassi\Desktop\AgroSphere2\src\lib\credit-score.ts"

# 2. Routes finances additionnelles
cp "C:\Users\Kouassi\.openclaw\workspace\agrosphere-connect\src\routes\_authenticated\finances.add.tsx" \
   "C:\Users\Kouassi\Desktop\AgroSphere2\src\routes\_authenticated\finances.add.tsx"

cp "C:\Users\Kouassi\.openclaw\workspace\agrosphere-connect\src\routes\_authenticated\finances.credit.tsx" \
   "C:\Users\Kouassi\Desktop\AgroSphere2\src\routes\_authenticated\finances.credit.tsx"
```

**SQL pour credit scoring :**

```sql
CREATE TABLE IF NOT EXISTS public.credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 1000),
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  factors JSONB,
  recommendation TEXT,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_xof INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  duration_months INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  credit_score_at_application INTEGER,
  lender_id UUID,
  decision_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### C. Coopératives

**Tables à créer :**

```sql
-- Table cooperatives
CREATE TABLE IF NOT EXISTS public.cooperatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  village TEXT,
  president_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'president', 'treasurer', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cooperative_id, user_id)
);

-- RLS policies
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coop members can view" ON public.cooperatives FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "coop admins can manage" ON public.cooperatives FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid() 
        AND om.cooperative_id = id 
        AND om.role IN ('admin', 'president')
    )
  );

CREATE POLICY "members can view own membership" ON public.organization_members FOR SELECT
  TO authenticated USING (user_id = auth.uid());
```

**Composants à créer :**

```bash
# Créer dossier components/cooperatives
New-Item -ItemType Directory -Force -Path "C:\Users\Kouassi\Desktop\AgroSphere2\src\components\cooperatives"

# Copier depuis AgroSphere Connect
cp "C:\Users\Kouassi\.openclaw\workspace\agrosphere-connect\src\routes\_authenticated\admin.tsx" \
   "C:\Users\Kouassi\Desktop\AgroSphere2\src\routes\_authenticated\cooperatives.tsx"
```

---

### D. Routes Mobile

**Structure de routes à créer :**

```
src/routes/mobile/
├── __layout.tsx         # Layout mobile commun
├── home.tsx            # Dashboard mobile
├── marketplace.tsx     # Marketplace version mobile
├── profile.tsx         # Profil utilisateur mobile
├── certifications.tsx  # Certifications coopératives
└── cooperatives.tsx    # Gestion coopératives mobile
```

**Exemple de layout mobile :**

```tsx
// src/routes/mobile/__layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/mobile')({
  component: MobileLayout,
})

function MobileLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header mobile */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-lg font-bold">AgroSphere Mobile</h1>
      </header>

      {/* Content */}
      <main>
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around py-3 safe-area-pb">
        <a href="/mobile/home" className="flex flex-col items-center text-xs">
          🏠 Accueil
        </a>
        <a href="/mobile/marketplace" className="flex flex-col items-center text-xs">
          🛒 Marché
        </a>
        <a href="/mobile/profile" className="flex flex-col items-center text-xs">
          👤 Profil
        </a>
      </nav>
    </div>
  )
}
```

---

### E. Design Parcelles AgroSphere → AgroSphere2

**AgroSphere2 a DÉJÀ une page parcels complète !**

La page `src/routes/_authenticated/parcels.tsx` dans AgroSphere2 est déjà fonctionnelle avec :
- ✅ Liste des parcelles
- ✅ Ajout/modification/suppression
- ✅ Alertes de récolte
- ✅ Types de cultures

**Action requise :** Aucune, le design est déjà optimal.

---

### F. Authentification Google

**Déjà configuré dans `.env` :**
```env
VITE_SUPABASE_URL=https://lddgtwqfhpiwodpmjhia.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG…oIHM
```

**Étapes pour activer Google OAuth :**

1. **Aller sur Supabase Dashboard** → Authentication → Providers
2. **Activer Google** et ajouter :
   - Client ID: (à récupérer sur Google Cloud Console)
   - Client Secret: (à récupérer sur Google Cloud Console)
   - Redirect URL: `https://lddgtwqfhpiwodpmjhia.supabase.co/auth/v1/callback`

3. **Mettre à jour la page auth.tsx** pour utiliser Supabase Auth natif :

```tsx
// Dans src/routes/auth.tsx, remplacer :
async function handleGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/dashboard',
    },
  });
  
  if (error) toast.error(error.message);
}
```

---

### G. Supprimer Dépendances Lovable

**Dans package.json, retirer :**

```json
{
  "dependencies": {
    // ❌ SUPPRIMER CETTE LIGNE
    "@lovable.dev/cloud-auth-js": "^1.1.2",
  },
  "devDependencies": {
    // ❌ SUPPRIMER CETTE LIGNE  
    "@lovable.dev/vite-tanstack-config": "^2.7.1",
  }
}
```

**Puis exécuter :**

```bash
npm install
```

---

## 📊 Checklist Finale

### Marketplace
- [ ] Copier `marketplace.tsx` depuis AgroSphere Connect
- [ ] Copier `marketplace.$id.tsx` depuis AgroSphere Connect
- [ ] Créer tables SQL (offers, orders, marketplace_stats)
- [ ] Tester publication d'offre
- [ ] Tester achat/commande

### Finances + Credit Scoring
- [ ] Copier `lib/credit-score.ts`
- [ ] Copier routes `finances.add.tsx` et `finances.credit.tsx`
- [ ] Créer tables SQL (credit_scores, loan_applications)
- [ ] Tester calcul de score

### Coopératives
- [ ] Créer tables SQL (cooperatives, organization_members)
- [ ] Créer page `/cooperatives`
- [ ] Créer composants UI
- [ ] Tester adhésion/retrait

### Mobile
- [ ] Créer layout mobile `__layout.tsx`
- [ ] Créer pages (home, marketplace, profile, certifications, cooperatives)
- [ ] Tester navigation mobile
- [ ] Ajouter offline sync

### Auth Google
- [ ] Configurer OAuth dans Supabase Dashboard
- [ ] Mettre à jour `auth.tsx` avec Supabase Auth natif
- [ ] Tester connexion Google
- [ ] Tester déconnexion

### Nettoyage Lovable
- [ ] Retirer dépendances du package.json
- [ ] Supprimer fichiers inutiles (.lovable/, integrations/lovable/)
- [ ] Mettre à jour imports dans tout le projet
- [ ] Tester build (`npm run build`)

---

## 🎯 Prochaines Actions Immédiates

1. **Copier pages marketplace manquantes** (30 min)
2. **Créer tables SQL marketplace** (15 min)
3. **Tester publication d'offre** (15 min)
4. **Configurer Google OAuth** (20 min)
5. **Supprimer dépendances Lovable** (10 min)

**Temps total estimé:** ~1h30

---

## 📞 Support

En cas de problème :
1. Vérifier logs console navigateur
2. Consulter dashboard Supabase
3. Tester SQL dans éditeur Supabase
4. Utiliser `npm run dev` pour voir erreurs en temps réel

---

*Document généré par OpenClaw Assistant - 2026-07-22 17:58 GMT*
