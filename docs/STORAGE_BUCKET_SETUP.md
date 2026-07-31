# 📦 Configuration du Storage Bucket agrofield-media

**Date:** 2026-07-23  
**Problème:** "Échec upload photo : Bucket not found"

---

## 🎯 Objectif

Créer le bucket de storage pour héberger les photos de reçus et diagnostics de maladies.

---

## 📋 Étapes Manuelles (Dashboard Supabase)

### Étape 1: Créer le Bucket

1. **Aller dans le Dashboard Supabase**
   - URL: https://supabase.com/dashboard/project/vtnduxtrnahhbgvlhqjw/storage

2. **Cliquez sur "New bucket"**

3. **Configuration :**
   ```
   Name: agrofield-media
   Public: ❌ Non (privé)
   File size limit: 10485760 (10MB)
   Allowed MIME types: image/jpeg, image/png, image/webp
   ```

4. **Cliquez sur "Create bucket"**

---

### Étape 2: Configurer les Policies RLS

1. **Allez dans SQL Editor** (dans le Dashboard Supabase)

2. **Exécutez ce script SQL :**

```sql
-- ============================================
-- POLICIES RLS POUR AGROFIELD-MEDIA
-- ============================================

-- 1. Policy: Voir ses propres fichiers
DROP POLICY IF EXISTS "Users can view their own media" ON storage.objects;
CREATE POLICY "Users can view their own media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Policy: Uploader ses propres fichiers
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy: Supprimer ses propres fichiers
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Mettre à jour ses propres fichiers (metadata)
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'agrofield-media';

-- Vérifier les policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%media%';
```

3. **Cliquez sur "Run"** pour exécuter le script

---

## ✅ Vérification

### Test 1: Vérifier dans le Dashboard

1. Allez dans **Storage → agrofield-media**
2. Vous devriez voir un bucket vide
3. Cliquez sur **"Policies"** pour vérifier les 4 policies créées

### Test 2: Tester l'Upload

Dans l'application Agrofield2 :

1. Connectez-vous avec votre compte
2. Allez dans la section **Finances** ou **Diagnostic IA**
3. Essayez d'uploader une photo
4. **Résultat attendu:** ✅ Upload réussi sans erreur "Bucket not found"

---

## 🔧 Script Automatique (Optionnel)

Si vous voulez automatiser plus tard, voici comment :

### 1. Récupérer la Service Role Key

- Dashboard → Settings → API
- Copiez **service_role key** (⚠️ Jamais côté client !)

### 2. Ajouter au .env

```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Exécuter le Script

```bash
cd C:\Users\Kouassi\Desktop\Agrofield2
node scripts/create-storage-bucket.mjs
```

---

## 📁 Structure de Stockage

Le bucket utilisera cette structure :

```
agrofield-media/
├── {user-id-1}/
│   ├── receipts/
│   │   ├── 20260723_123456_receipt.jpg
│   │   └── 20260723_789012_mobile_money.png
│   └── disease/
│       ├── 20260723_analysis_1.jpg
│       └── 20260723_analysis_2.png
├── {user-id-2}/
│   └── ...
└── {user-id-3}/
    └── ...
```

**Avantages :**
- ✅ Chaque utilisateur ne voit que ses fichiers
- ✅ Isolation par dossier user-id
- ✅ Sécurité RLS automatique

---

## 🔐 Sécurité

### Ce qui est protégé :

- ✅ Seuls les utilisateurs authentifiés peuvent accéder au bucket
- ✅ Chaque utilisateur ne voit QUE ses propres fichiers
- ✅ Impossible de lister les fichiers des autres
- ✅ Upload limité à 10MB par fichier
- ✅ Seules les images sont acceptées

### Bonnes Pratiques :

- ⚠️ **Jamais** exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- ⚠️ Utiliser des URLs signées pour l'accès temporaire aux images
- ⚠️ Valider le type de fichier côté serveur avant upload

---

## 🚀 Prochaines Étapes

Après avoir créé le bucket :

1. ✅ Tester l'upload de photo dans l'app
2. ✅ Vérifier que l'image apparaît dans Storage Dashboard
3. ✅ Implémenter l'affichage des images uploadées
4. ✅ Ajouter la suppression d'images si besoin

---

## 📞 Dépannage

### Erreur: "Bucket already exists"
→ Le bucket a déjà été créé, passez directement aux policies

### Erreur: "permission denied for table objects"
→ Utilisez le Dashboard, pas l'API (besoin de droits admin)

### Erreur: "Bucket not found" après création
→ Attendez 1-2 minutes que la propagation se fasse
→ Vérifiez que le nom est exactement `agrofield-media`

### Upload échoue avec "Unauthorized"
→ Vérifiez que l'utilisateur est connecté
→ Vérifiez les policies RLS

---

**Document créé par:** OpenClaw Assistant  
**Dernière mise à jour:** 2026-07-23 10:50 GMT  
**Statut:** ✅ Instructions prêtes pour création manuelle
