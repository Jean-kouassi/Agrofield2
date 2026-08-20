# 🛠️ Marketplace - Plan de Correction Complet

**Date:** 2026-08-19  
**Statut:** En cours

---

## ✅ Corrections Déjà Appliquées

### 1. Upload des Photos vers Supabase Storage
- **Fichier:** `src/lib/marketplace.service.ts`
- **Fonction:** `uploadImage()` + mise à jour de `createListing()`
- **Statut:** ✅ Déployé
- **Problème restant:** Les photos peuvent ne pas s'afficher si le bucket `agrofield-media` n'a pas les bonnes politiques RLS

### 2. Trigger Seller Statistics Désactivé
- **Migration:** `20260819133001_force_disable_seller_stats.sql`
- **Statut:** ✅ Appliqué
- **Impact:** Plus d'erreur 403 lors de la publication

### 3. Coordonnées GPS dans la DB
- **Migrations:** `20260819123001_add_gps_coordinates_to_marketplace_listings.sql`
- **Colonnes:** `latitude`, `longitude`, `location_address`
- **Statut:** ✅ Déployé

---

## 🔧 Corrections à Appliquer

### 1. Vérifier/Corriger Politiques RLS du Bucket Storage
**Problème:** Les photos uploadées peuvent être bloquées par RLS

**Solution:**
```sql
-- S'assurer que le bucket existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agrofield-media', 'agrofield-media', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'agrofield-media' AND owner = auth.uid());

-- Politique pour permettre lecture publique
CREATE POLICY "Public access to marketplace images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'agrofield-media');
```

**Fichier:** `supabase/migrations/20260819140001_fix_storage_policies.sql`

---

### 2. Mettre à Jour EditOfferModal avec GPS
**Fichier:** `src/components/marketplace/edit-offer-modal.tsx`

**Champs à ajouter:**
- `latitude?: number | null`
- `longitude?: number | null`
- `location_address?: string | null`
- Affichage optionnel pour modifier la position GPS

---

### 3. Rafraîchissement Automatique Après Publication
**Fichier:** `src/routes/_authenticated/marketplace.tsx`

**Solution:**
- Utiliser un événement custom ou recharger la page après succès
- Ou utiliser TanStack Query avec `refetchOnWindowFocus`

---

### 4. Vérifier Page Principale /marketplace
**Fichier:** `src/routes/_authenticated/marketplace.tsx`

**Vérifications:**
- [ ] Requête SQL correcte avec filtre `status = 'available'`
- [ ] Affichage des images depuis `images` column (JSON array d'URLs)
- [ ] Tri par `created_at DESC`
- [ ] Gestion des erreurs et loading states

---

## 📋 Checklist de Test

Après corrections:
- [ ] Publier une offre AVEC photos → Vérifier dans "Mes offres"
- [ ] Modifier une offre (GPS inclus) → Vérifier sauvegarde
- [ ] Voir les offres actives sur `/marketplace`
- [ ] Refresh auto après publication
- [ ] Supprimer une offre → Confirmation + refresh

---

## 🚀 Prochaines Actions Immédiates

1. **Créer migration pour storage policies** (CRITIQUE pour les photos)
2. **Mettre à jour EditOfferModal** avec GPS
3. **Ajouter refresh automatique** après publication
4. **Tester en production**
