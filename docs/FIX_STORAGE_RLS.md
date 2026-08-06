# 🔧 FIX - Storage RLS Policies pour agrofield-media

## 🐛 Problème
Erreur "Reçu introuvable" quand on clique sur "Voir le reçu" en prod.

## 🔍 Cause Probable
Les policies RLS du bucket `agrofield-media` ne permettent pas la lecture aux utilisateurs authentifiés.

## ✅ Solution - Exécuter dans Supabase SQL Editor

### Étape 1: Vérifier l'état actuel
```sql
-- Voir toutes les policies du bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

### Étape 2: Créer/Corriger les policies (SI NÉCESSAIRE)

```sql
-- Policy pour lire ses propres fichiers
CREATE POLICY "Users can view their own media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy pour uploader ses propres fichiers
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy pour supprimer ses propres fichiers
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Étape 3: Vérifier que le bucket existe
```sql
-- Voir tous les buckets
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- Si 'agrofield-media' n'existe pas, le créer:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agrofield-media',
  'agrofield-media',
  false, -- privé
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);
```

### Étape 4: Tester manuellement
```sql
-- Voir les fichiers dans le bucket
SELECT 
  name,
  owner,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mimetype,
  created_at
FROM storage.objects
WHERE bucket_id = 'agrofield-media'
ORDER BY created_at DESC
LIMIT 10;
```

## 🧪 Test Manuel Après Fix

1. **Ouvrir DevTools Console** (F12)
2. **Aller sur** https://agrofield2.pages.dev/finance
3. **Cliquer "Voir le reçu"** sur une transaction
4. **Vérifier les logs:**
   ```
   [DEBUG] Tentative lecture reçu: {path: "receipts/...", ...}
   [DEBUG] URL générée avec succès: https://...
   [DEBUG] Test response status: 200
   ```

5. **Si erreur RLS:**
   ```
   [DEBUG] Erreur Supabase Storage: {message: "new row violates row-level security policy", ...}
   ```
   → Exécuter les policies SQL ci-dessus

## 📝 Notes Importantes

- Le chemin des reçus est: `receipts/{user_id}/{timestamp}-{random}.{ext}`
- Les policies doivent autoriser la lecture SI `(storage.foldername(name))[1] = auth.uid()`
- Le bucket DOIT être privé (`public = false`) pour la sécurité
- Taille max: 10MB (suffisant pour photos de reçus)

## 🔗 Liens Utiles

- Supabase Dashboard: https://vtnduxtrnahhbgvlhqjw.supabase.co
- Documentation RLS: https://supabase.com/docs/guides/auth/row-level-security
- Storage Guide: https://supabase.com/docs/guides/storage

---

**Date:** 2026-08-06  
**Priorité:** 🔴 Haute (bloque fonctionnalité reçus)
