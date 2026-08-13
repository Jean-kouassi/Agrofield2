# 🗄️ Guide de Migration SQL - AgroSphere2

**Date:** 25 Juillet 2026  
**Objectif:** Appliquer les nouvelles tables (parcels, crop_events, price_references) dans Supabase

---

## 📋 Étape 1: Backup de la Base de Données

**AVANT TOUTE CHOSE**, fais un backup :

### Option A: Via Dashboard Supabase (Recommandé)
1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. **Database** → **Backups** → **Create a backup**
4. Nomme-le `backup-before-migration-2026-07-25`
5. Clique sur **Create backup**

### Option B: Exporter les données existantes
1. **Table Editor** → Sélectionne chaque table
2. Clique sur **⋮** (3 points) → **Export data**
3. Choisis format **CSV**
4. Sauvegarde localement

---

## 📋 Étape 2: Appliquer les Migrations SQL

### Méthode 1: Via SQL Editor (Plus simple)

1. **Ouvre le dashboard Supabase**: https://supabase.com/dashboard
2. **SQL Editor** → **New query**
3. **Copie-colle** le contenu du fichier ci-dessous
4. Clique sur **Run** (Ctrl+Entrée)
5. Vérifie qu'il n'y a pas d'erreurs

### Méthode 2: Via CLI (Si tu as Supabase CLI installé)

```bash
cd C:\Users\Kouassi\Desktop\AgroSphere2
npx supabase db push
```

---

## 📄 Fichier SQL à Exécuter

Copie ce code dans le SQL Editor :

```sql
-- ============================================
-- MIGRATION P0: Parcelles & Suivi Cultural
-- Date: 2026-07-25
-- Projet: AgroSphere2
-- ============================================

-- 1. Fonction update_updated_at_column (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Table parcels - Gestion des parcelles agricoles
CREATE TABLE IF NOT EXISTS public.parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_ha NUMERIC NOT NULL DEFAULT 0,
  crop_type TEXT NOT NULL,
  sowing_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'fallow', 'abandoned')),
  location_quarter TEXT,
  location_gps_lat NUMERIC,
  location_gps_lng NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_parcels_user_id ON public.parcels(user_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_crop_type ON public.parcels(crop_type);

-- Trigger updated_at
DROP TRIGGER IF EXISTS parcels_updated_at ON public.parcels;
CREATE TRIGGER parcels_updated_at
  BEFORE UPDATE ON public.parcels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own parcels" ON public.parcels;
CREATE POLICY "Users can view their own parcels"
  ON public.parcels FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own parcels" ON public.parcels;
CREATE POLICY "Users can insert their own parcels"
  ON public.parcels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own parcels" ON public.parcels;
CREATE POLICY "Users can update their own parcels"
  ON public.parcels FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own parcels" ON public.parcels;
CREATE POLICY "Users can delete their own parcels"
  ON public.parcels FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Table crop_events - Suivi cultural
CREATE TABLE IF NOT EXISTS public.crop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sowing', 'irrigation', 'fertilization', 'treatment', 'weeding', 'harvest', 'other')),
  event_date DATE NOT NULL DEFAULT (now()::date),
  notes TEXT,
  yield_kg NUMERIC,
  input_cost_fcfa NUMERIC,
  labor_cost_fcfa NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_crop_events_user_id ON public.crop_events(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_events_parcel_id ON public.crop_events(parcel_id);
CREATE INDEX IF NOT EXISTS idx_crop_events_event_type ON public.crop_events(event_type);
CREATE INDEX IF NOT EXISTS idx_crop_events_event_date ON public.crop_events(event_date);

-- RLS
ALTER TABLE public.crop_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own crop events" ON public.crop_events;
CREATE POLICY "Users can view their own crop events"
  ON public.crop_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own crop events" ON public.crop_events;
CREATE POLICY "Users can insert their own crop events"
  ON public.crop_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own crop events" ON public.crop_events;
CREATE POLICY "Users can update their own crop events"
  ON public.crop_events FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own crop events" ON public.crop_events;
CREATE POLICY "Users can delete their own crop events"
  ON public.crop_events FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Table price_references - Références de prix
CREATE TABLE IF NOT EXISTS public.price_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('crop', 'input')),
  key TEXT NOT NULL,
  min_fcfa NUMERIC NOT NULL,
  max_fcfa NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  region TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kind, key, region)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_price_references_kind ON public.price_references(kind);
CREATE INDEX IF NOT EXISTS idx_price_references_key ON public.price_references(key);
CREATE INDEX IF NOT EXISTS idx_price_references_region ON public.price_references(region);

-- Trigger updated_at
DROP TRIGGER IF EXISTS price_references_updated_at ON public.price_references;
CREATE TRIGGER price_references_updated_at
  BEFORE UPDATE ON public.price_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.price_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view price references" ON public.price_references;
CREATE POLICY "Anyone can view price references"
  ON public.price_references FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage price references" ON public.price_references;
CREATE POLICY "Admins can manage price references"
  ON public.price_references FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Données de référence (prix moyens Burkina Faso 2026)
INSERT INTO public.price_references (kind, key, min_fcfa, max_fcfa, unit, region, note) VALUES
  ('crop', 'mil', 200, 350, 'kg', 'Burkina Faso', 'Prix moyen saison sèche'),
  ('crop', 'sorgho', 250, 400, 'kg', 'Burkina Faso', 'Prix moyen saison sèche'),
  ('crop', 'maïs', 150, 300, 'kg', 'Burkina Faso', 'Prix moyen'),
  ('crop', 'riz', 400, 600, 'kg', 'Burkina Faso', 'Riz local'),
  ('crop', 'niébé', 500, 800, 'kg', 'Burkina Faso', 'Haricot local'),
  ('crop', 'arachide', 600, 900, 'kg', 'Burkina Faso', 'Arachide coque'),
  ('crop', 'sésame', 800, 1200, 'kg', 'Burkina Faso', 'Sésame blanc'),
  ('crop', 'coton', 250, 350, 'kg', 'Burkina Faso', 'Coton graine'),
  ('crop', 'tomate', 200, 500, 'kg', 'Burkina Faso', 'Tomate fraîche (variable)'),
  ('crop', 'oignon', 150, 400, 'kg', 'Burkina Faso', 'Oignon sec'),
  ('input', 'engrais_uree', 12000, 15000, 'sac_50kg', 'Burkina Faso', 'Urée 46%'),
  ('input', 'engrais_npk', 15000, 18000, 'sac_50kg', 'Burkina Faso', 'NPK 15-15-15'),
  ('input', 'semence_maïs', 2000, 3000, 'kg', 'Burkina Faso', 'Semence améliorée'),
  ('input', 'semence_sorgho', 1500, 2500, 'kg', 'Burkina Faso', 'Semence locale'),
  ('input', 'pesticide_generique', 5000, 8000, 'litre', 'Burkina Faso', 'Pesticide courant')
ON CONFLICT (kind, key, region) DO UPDATE SET
  min_fcfa = EXCLUDED.min_fcfa,
  max_fcfa = EXCLUDED.max_fcfa,
  updated_at = now();

-- ============================================
-- ✅ Migration terminée !
-- Tables créées: parcels, crop_events, price_references
-- Données de référence: 15 entrées
-- ============================================
```

---

## 📋 Étape 3: Vérification

Après avoir exécuté le SQL :

1. **Table Editor** → Rafraîchis la page
2. Vérifie que les tables suivantes existent :
   - ✅ `parcels`
   - ✅ `crop_events`
   - ✅ `price_references`
3. Clique sur `price_references` → Vérifie qu'il y a 15 lignes de données

---

## 📋 Étape 4: Tester l'Application

1. **Redémarre le serveur de dev** :
   ```bash
   cd C:\Users\Kouassi\Desktop\AgroSphere2
   npm run dev
   ```

2. **Ouvre** : http://localhost:8088/

3. **Connecte-toi** avec ton compte

4. **Va dans** :
   - `/dashboard` → Devrait afficher les parcelles
   - `/parcels` → Page de gestion des parcelles
   - `/marketplace` → Marketplace fonctionnel

---

## ⚠️ En Cas de Problème

### Erreur: "relation already exists"
Les tables existent déjà → Ce n'est pas grave, la migration a déjà été appliquée.

### Erreur: "permission denied"
Tu utilises la mauvaise clé API → Utilise la **Service Role Key** dans le SQL Editor.

### Erreur: "column does not exist"
Une colonne manque → Exécute quand même le reste, puis ajoute les colonnes manquantes manuellement.

---

## 🆘 Besoin d'Aide ?

1. **Dashboard Supabase**: https://supabase.com/dashboard
2. **Docs Supabase**: https://supabase.com/docs
3. **Logs d'erreur**: Dashboard → Database → Query Performance

---

**Prochaine étape après migration :**
- [ ] Tester la page `/parcels`
- [ ] Ajouter une parcelle test
- [ ] Vérifier les alertes de récolte
- [ ] Commit & push sur GitHub

Bon courage ! 🚀
