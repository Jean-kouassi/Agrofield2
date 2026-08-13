# 🚨 FIX URGENT - Boucle Infinie RLS

**Date:** 2026-08-12 14:30 GMT  
**Priorité:** 🔴 **CRITIQUE** — Marketplace HS  
**Erreur:** `infinite recursion detected in policy for relation "profiles"`  
**Code:** `42P17`

---

## 🐛 Problème

La marketplace est **hors service** avec une erreur 500:

```
GET https://vtnduxtrnahhbgvlhqjw.supabase.co/rest/v1/marketplace_listings?select=*&status=eq.available
→ 500 Internal Server Error
→ infinite recursion detected in policy for relation "profiles"
```

### Cause Racine

La migration `20260811000001_roles_and_rls.sql` a créé une policy RLS qui cause une **récursion infinie**:

```sql
-- Policy PROBLÉMATIQUE sur profiles
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
```

**Scénario de boucle:**
1. Query: `SELECT * FROM marketplace_listings JOIN profiles ON ...`
2. PostgreSQL vérifie RLS sur `marketplace_listings` → OK
3. PostgreSQL vérifie RLS sur `profiles` (JOIN)
4. Policy `profiles_select_own_or_admin` fait `SELECT 1 FROM public.profiles WHERE ...`
5. → Déclenche à nouveau la policy RLS sur `profiles`
6. → Boucle infinie détectée par PostgreSQL

---

## ✅ Solution

### Migration Fix Créée

Fichier: `supabase/migrations/20260812000000_fix_infinite_recursion.sql`

**Solution:** Utiliser une fonction SQL `SECURITY DEFINER` stable qui ne déclenche pas RLS:

```sql
-- Fonction helper (ne déclenche PAS RLS)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Nouvelle policy (SANS récursion)
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin_user()  -- ← Appel fonction, PAS de SELECT direct
  );
```

---

## 📋 Actions Requises

### Étape 1: Appliquer la Migration (MAINTENANT)

**Option A: Via Supabase Dashboard (Recommandé)**

1. Ouvre https://vtnduxtrnahhbgvlhqjw.supabase.co
2. Va dans **SQL Editor**
3. Copie-colle le contenu de `supabase/migrations/20260812000000_fix_infinite_recursion.sql`
4. Clique **Run**
5. Vérifie qu'il n'y a pas d'erreur

**Option B: Via CLI Supabase**

```bash
cd C:\Users\Kouassi\Desktop\AgroSphere2
npx supabase db push
```

---

### Étape 2: Vérifier que c'est Fixé

**Test 1: Requête directe dans SQL Editor**

```sql
-- Cette requête doit fonctionner sans erreur
SELECT 
  id,
  title,
  price,
  status
FROM marketplace_listings
WHERE status = 'available'
ORDER BY created_at DESC
LIMIT 10;
```

**Test 2: Dans l'application**

1. Ouvre https://AgroSphere2.vercel.app (ou localhost:5173)
2. Connecte-toi
3. Va sur `/marketplace`
4. ✅ Les offres doivent s'afficher sans erreur 500

**Test 3: Console DevTools**

```javascript
// Dans la console browser (F12)
const { data, error } = await supabase
  .from('marketplace_listings')
  .select('*')
  .eq('status', 'available')
  .limit(5);

console.log('Error:', error); // Doit être null
console.log('Data:', data);   // Doit afficher les listings
```

---

## 🎨 Formulaire Création d'Offre

### Structure Actuelle

Le formulaire de création d'offre existe dans:

1. **Composant principal:** `src/components/marketplace/publish-modal.tsx`
   - ✅ Multi-étapes (5 steps)
   - ✅ Upload images
   - ✅ Catégories + Régions + Unités
   - ✅ Résumé avant publication

2. **Composant legacy:** `src/components/marketplace/CreateOfferForm.tsx`
   - ⚠️ Formulaire simple (à supprimer ou migrer)

### Couleurs & Design System

**Tokens utilisés (conforme AgroSphere2_ARCHITECTURE.md):**

```css
/* styles.css */
--agro-primary: #166534     /* Vert forêt */
--agro-light: #bbf7d0       /* Vert clair */
--agro-pale: #f0fdf4        /* Vert très pâle */
--agro-accent: #d97706      /* Ocre */
--agro-soil: #92400e        /* Terre */
--agro-sky: #0ea5e9         /* Bleu irrigation */
```

**Dans publish-modal.tsx:**

```tsx
// Badge étape active
background: 'var(--agro-primary)'  // #166534
color: '#fff'
boxShadow: '0 0 0 3px rgba(22,101,52,0.18)'

// Texte labels
color: step === current ? 'var(--agro-primary)' : 'var(--agro-muted)'

// Bouton publier
background: 'var(--agro-primary)'
hover: opacity-90
```

### Champs du Formulaire

| Étape | Champs | Validation |
|-------|--------|------------|
| 1. Infos | Titre, Description, Catégorie | Titre > 0 char, Desc ≥ 20 chars |
| 2. Prix & Qté | Prix (FCFA), Quantité, Unité, Min Order | Tous > 0 |
| 3. Localisation | Région, Ville | Ville > 0 char |
| 4. Photos | Upload 0-5 images | Optionnel |
| 5. Résumé | Aperçu complet | Validation finale |

### Pour Créer une Nouvelle Page Dédiée

Si tu veux une page `/marketplace/create` au lieu d'un modal:

**Fichier à créer:** `src/routes/_authenticated/marketplace.create.tsx`

```tsx
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PublishModal } from "@/components/marketplace/publish-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketplace/create")({
  head: () => ({
    meta: [
      { title: "Créer une offre — AgroSphere" },
      { name: "description", content: "Publiez votre produit agricole sur le marketplace." },
    ],
  }),
  component: CreateOfferPage,
});

function CreateOfferPage() {
  const router = useRouter();
  
  function handleClose() {
    router.navigate({ to: "/marketplace" });
  }
  
  function handlePublish(data) {
    toast.success("Offre publiée avec succès !");
    router.navigate({ to: "/marketplace/my-offers" });
  }
  
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Créer une nouvelle offre</h1>
      <PublishModal onClose={handleClose} onPublish={handlePublish} />
    </div>
  );
}
```

---

## 🧪 Checklist Tests Après Fix

- [ ] **SQL:** Requête `SELECT * FROM marketplace_listings` fonctionne
- [ ] **App:** Page `/marketplace` charge sans erreur 500
- [ ] **App:** Page `/marketplace/:id` détail offre fonctionne
- [ ] **App:** Formulaire création offre (`publish-modal`) fonctionne
- [ ] **App:** Publication effective en DB
- [ ] **RLS:** User non-admin ne voit que ses propres données
- [ ] **RLS:** Admin voit toutes les données

---

## 📞 Commandes Utiles

```bash
# Test build local
cd C:\Users\Kouassi\Desktop\AgroSphere2
npm run build

# Test TypeScript
npx tsc --noEmit

# Deploy Vercel (après fix)
vercel --prod

# Deploy Cloudflare (après fix)
npx wrangler deploy dist/_worker.js

# Backup DB (avant modif)
npx supabase db dump --schema public > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🔗 Fichiers Liés

- **Migration fix:** `supabase/migrations/20260812000000_fix_infinite_recursion.sql`
- **Migration originale:** `supabase/migrations/20260811000001_roles_and_rls.sql`
- **Formulaire:** `src/components/marketplace/publish-modal.tsx`
- **Service:** `src/lib/marketplace.service.ts`
- **Types:** `src/lib/marketplace-data.ts`

---

## 📝 Notes Importantes

1. **Ne jamais faire de SELECT sur une table avec RLS dans une policy de la même table**
2. **Toujours utiliser des fonctions `SECURITY DEFINER` pour les checks de rôle**
3. **Tester les policies avec différents rôles avant déploiement**
4. **Backup DB avant toute migration RLS**

---

**Généré par:** OpenClaw Agent  
**Priorité:** 🔴 CRITIQUE — À appliquer IMMÉDIATEMENT  
**Prochaine action:** Exécuter migration dans Supabase SQL Editor
