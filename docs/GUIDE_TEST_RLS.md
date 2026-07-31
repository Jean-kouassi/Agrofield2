# 🧪 Guide de Test RLS - AgroField2

**Date:** 30 Juillet 2026  
**Statut:** ⚠️ Tests automatisés échoués - Validation manuelle requise  
**Priorité:** 🔴 HAUTE (sécurité des données)

---

## ⚠️ Problèmes Identifiés

Les tests automatisés ont révélé les problèmes suivants :

1. **`parcels` accessible sans auth** - RLS peut-être mal configuré
2. **Tables système non trouvées** - `information_schema.columns` non accessible via API
3. **`price_references` vide** - Données de référence non présentes
4. **Contrainte FK user_id** - Insertion avec UUID nul rejetée (comportement normal)

---

## ✅ Méthode de Test Manuel (Recommandée)

### Étape 1: Accéder à Supabase Studio

1. Ouvrir https://vtnduxtrnahhbgvlhqjw.supabase.co
2. Se connecter avec credentials admin
3. Aller dans **SQL Editor**

---

### Étape 2: Vérifier Activation RLS

Exécuter cette requête :

```sql
-- Vérifier si RLS est activé sur chaque table
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('parcels', 'crop_events', 'price_references');
```

**Résultat attendu :**
```
tablename         | rls_enabled
------------------+------------
parcels           | t
crop_events       | t
price_references  | t
```

✅ Si `t` (true) pour toutes → RLS est activé  
❌ Si `f` (false) → Activer avec `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`

---

### Étape 3: Vérifier Policies Existantes

```sql
-- Lister toutes les policies RLS
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Résultat attendu pour `parcels` :**

| policyname | cmd | qual | with_check |
|------------|-----|------|------------|
| Users can view their own parcels | SELECT | `(auth.uid() = user_id)` | - |
| Users can insert their own parcels | INSERT | - | `(auth.uid() = user_id)` |
| Users can update their own parcels | UPDATE | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| Users can delete their own parcels | DELETE | `(auth.uid() = user_id)` | - |

**Résultat attendu pour `crop_events` :** Mêmes policies avec `user_id = auth.uid()`

**Résultat attendu pour `price_references` :**

| policyname | cmd | qual |
|------------|-----|------|
| Anyone can view price references | SELECT | `true` |
| Admins can manage price references | ALL | `true` |

---

### Étape 4: Test avec 2 Utilisateurs Réels

#### 4a. Créer 2 users de test

Dans Supabase Dashboard :
1. Aller dans **Authentication → Users**
2. Click **Add user** → Create new user
3. Créer :
   - **Alice:** `alice.test@agrofield.bf` / `TestPass123!`
   - **Bob:** `bob.test@agrofield.bf` / `TestPass123!`

#### 4b. Tester avec Alice

1. Se déconnecter de l'admin
2. Se connecter avec Alice dans votre app (ou via API)
3. Créer une parcelle :

```javascript
const { data, error } = await supabase
  .from('parcels')
  .insert({
    name: 'Parcelle Alice',
    area_ha: 2.5,
    crop_type: 'maïs',
    status: 'active'
  });
```

4. Vérifier qu'Alice voit sa parcelle :

```javascript
const { data } = await supabase.from('parcels').select();
console.log(data); // Devrait montrer 1 parcelle
```

#### 4c. Tester avec Bob

1. Déconnecter Alice
2. Connecter Bob
3. Vérifier les parcelles visibles :

```javascript
const { data } = await supabase.from('parcels').select();
console.log(data); // Devrait être [] (vide) ou seulement parcelles de Bob
```

**✅ RLS fonctionne si :**
- Alice ne voit QUE ses parcelles
- Bob ne voit QUE ses parcelles
- Bob ne voit PAS les parcelles d'Alice

---

### Étape 5: Test d'Isolation (Critique)

Toujours connecté avec **Bob** :

```javascript
// Tenter de modifier une parcelle d'Alice (doit échouer)
const { error } = await supabase
  .from('parcels')
  .update({ name: 'Piraté par Bob!' })
  .eq(id, '<ID_PARCELLE_ALICE>');

if (error) {
  console.log('✅ RLS bloque la modification:', error.message);
} else {
  console.log('❌ FAIL: Bob a pu modifier la parcelle d\'Alice!');
}
```

---

### Étape 6: Vérifier Index de Performance

```sql
-- Liste des index sur parcels et crop_events
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('parcels', 'crop_events')
ORDER BY tablename, indexname;
```

**Index requis :**

Pour `parcels` :
- `idx_parcels_user_id` ON `user_id`
- `idx_parcels_status` ON `status`
- `idx_parcels_crop_type` ON `crop_type`

Pour `crop_events` :
- `idx_crop_events_user_id` ON `user_id`
- `idx_crop_events_parcel_id` ON `parcel_id`
- `idx_crop_events_event_type` ON `event_type`
- `idx_crop_events_event_date` ON `event_date`

---

### Étape 7: Vérifier Triggers updated_at

```sql
-- Liste des triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%';
```

**Résultat attendu :**

| trigger_name | event_object_table | action_statement |
|--------------|-------------------|------------------|
| parcels_updated_at | parcels | `EXECUTE FUNCTION update_updated_at_column()` |
| crop_events_updated_at | crop_events | `EXECUTE FUNCTION update_updated_at_column()` |
| price_references_updated_at | price_references | `EXECUTE FUNCTION update_updated_at_column()` |

---

### Étape 8: Vérifier Données de Référence

```sql
-- Compter les références de prix
SELECT COUNT(*) FROM public.price_references;

-- Voir un échantillon
SELECT kind, key, min_fcfa, max_fcfa, unit, region 
FROM public.price_references 
LIMIT 10;
```

**Minimum attendu:** 10-15 entrées (mil, sorgho, maïs, riz, engrais, etc.)

---

## 🔧 Corrections Requises

### Si RLS n'est pas activé :

```sql
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_references ENABLE ROW LEVEL SECURITY;
```

### Si policies manquantes :

Voir fichier de migration : `supabase/migrations/001_create_parcels_and_crop_events.sql`

### Si index manquants :

```sql
-- Parcels
CREATE INDEX IF NOT EXISTS idx_parcels_user_id ON public.parcels(user_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_crop_type ON public.parcels(crop_type);

-- Crop events
CREATE INDEX IF NOT EXISTS idx_crop_events_user_id ON public.crop_events(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_events_parcel_id ON public.crop_events(parcel_id);
CREATE INDEX IF NOT EXISTS idx_crop_events_event_type ON public.crop_events(event_type);
CREATE INDEX IF NOT EXISTS idx_crop_events_event_date ON public.crop_events(event_date);
```

### Si données de référence vides :

Exécuter la section INSERT du fichier de migration (voir fin du fichier `001_create_parcels_and_crop_events.sql`)

---

## ✅ Checklist de Validation

Avant de considérer RLS comme "validé" :

- [ ] RLS activé sur `parcels`, `crop_events`, `price_references`
- [ ] 4 policies par table (SELECT, INSERT, UPDATE, DELETE)
- [ ] Policy SELECT sur `price_references` = `true` (accès public authentifié)
- [ ] Test utilisateur Alice vs Bob réussi (isolation totale)
- [ ] Index présents sur `user_id`, `parcel_id`, colonnes filtrées
- [ ] Triggers `updated_at` fonctionnels
- [ ] Données de référence peuplées (min 10 entrées)
- [ ] Build TypeScript OK (`npm run build`)
- [ ] Tests UI manuels (création/modification/suppression parcelles)

---

## 📊 Résultats Attendus

| Table | RLS Activé | Policies | Index | Triggers | Statut |
|-------|-----------|----------|-------|----------|--------|
| parcels | ✅ | 4 | 3 | ✅ | 🟢 OK |
| crop_events | ✅ | 4 | 4 | ✅ | 🟢 OK |
| price_references | ✅ | 2 | 3 | ✅ | 🟢 OK |

---

## 🚨 Notes de Sécurité

⚠️ **NE JAMAIS :**
- Désactiver RLS en production
- Utiliser `service_role` key côté client
- Exposer `SUPABASE_SERVICE_ROLE_KEY` dans le frontend

✅ **TOUJOURS :**
- Tester avec 2+ utilisateurs avant déploiement
- Utiliser `anon` key dans le frontend
- Vérifier logs Supabase après déploiement
- Backup DB avant modifications RLS

---

## 📞 Support

- **Dashboard Supabase:** https://vtnduxtrnahhbgvlhqjw.supabase.co
- **Docs RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Logs:** Dashboard → Database → Logs

---

**Dernière mise à jour:** 2026-07-30 09:30 GMT  
**Prochaine review:** Après tests manuels avec Alice/Bob
