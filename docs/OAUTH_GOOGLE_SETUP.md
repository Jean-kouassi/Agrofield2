# 🔐 Configuration OAuth Google - AgroField2

## 🎯 Problème Résolu

Erreur `bad_oauth_state` sur mobile après connexion Google.

---

## ✅ Étape 1 : Configurer Supabase Dashboard

### 1.1 URL Configuration

**URL :** https://supabase.com/dashboard/project/vtnduxtrnahhbgvlhqjw/authentication/url-configuration

**Site URL :**
```
https://agrofield2.vercel.app
```

**Additional Redirect URLs :**
```
https://agrofield2.vercel.app/
https://agrofield2.vercel.app/auth/v1/callback
http://localhost:8080/
http://localhost:8080/auth/v1/callback
```

**⚠️ Important :**
- Ajoute TOUTES ces URLs (une par ligne)
- Inclut à la fois localhost ET l'URL Vercel
- Sauvegarde en bas de page

---

## ✅ Étape 2 : Vérifier Google Cloud Console (si nécessaire)

**URL :** https://console.cloud.google.com/apis/credentials

### Authorized redirect URIs :

```
https://agrofield2.vercel.app/auth/v1/callback
http://localhost:8080/auth/v1/callback
```

**Si tu modifies quelque chose ici :**
1. Sauvegarde dans Google Cloud Console
2. Attends 2-3 minutes (propagation)
3. Retourne dans Supabase → Authentication → Providers → Google
4. Clique "Save" même sans changement (rafraîchit la config)

---

## ✅ Étape 3 : Tester la Connexion

### Sur PC (localhost) :

1. **Démarre le serveur** :
   ```bash
   npm run dev
   ```

2. **Ouvre** : http://localhost:8080
3. **Clique** : "Continuer avec Google"
4. **Choisis** ton compte Google
5. **Doit rediriger** vers http://localhost:8080/dashboard ✅

### Sur Mobile (Production) :

1. **Ouvre** : https://agrofield2.vercel.app
2. **Clique** : "Continuer avec Google"
3. **Choisis** ton compte Google
4. **Doit rediriger** vers https://agrofield2.vercel.app/dashboard ✅

---

## 🚨 Dépannage

### Erreur : `bad_oauth_state`

**Cause :** URL de redirection ne correspond pas à celle configurée dans Supabase.

**Solution :**
1. Vérifie que l'URL que tu utilises est dans Supabase Dashboard
2. Si tu utilises `http://192.168.x.x:8080`, ajoute-le aussi :
   ```
   http://192.168.11.100:8080/
   http://192.168.11.100:8080/auth/v1/callback
   ```

### Erreur : `redirect_uri_mismatch`

**Cause :** Google Cloud Console n'a pas la bonne URL.

**Solution :**
1. Va sur https://console.cloud.google.com/apis/credentials
2. Trouve ton OAuth Client ID pour AgroField
3. Ajoute l'URL manquante dans "Authorized redirect URIs"
4. Sauvegarde et attends 2-3 minutes

### La connexion marche sur PC mais pas sur mobile

**Cause :** Mobile utilise une URL différente (IP locale ou Vercel).

**Solution :**
- **Option A** : Utilise UNIQUEMENT https://agrofield2.vercel.app sur mobile
- **Option B** : Ajoute l'URL IP locale dans Supabase :
  ```
  http://192.168.11.100:8080/
  ```

---

## 📋 Checklist Finale

- [ ] Site URL configurée dans Supabase : `https://agrofield2.vercel.app`
- [ ] Redirect URLs ajoutées (localhost + Vercel)
- [ ] Google OAuth activé dans Supabase
- [ ] Client ID + Secret remplis dans Supabase
- [ ] Test PC réussi : http://localhost:8080
- [ ] Test mobile réussi : https://agrofield2.vercel.app

---

## 🎉 Une fois Validé

Supprime ce fichier et mets à jour la documentation principale.

**Dernière mise à jour :** 2026-07-30 16:15  
**Statut :** ✅ Configuration standardisée
