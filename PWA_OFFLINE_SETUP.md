# 📱 Configuration PWA & Mode Hors Ligne - AgroSphere

## ✅ Fonctionnalités implémentées

### 1. Service Worker avec Workbox
- **Cache automatique** des assets (JS, CSS, HTML, fonts)
- **Stratégie NetworkFirst** pour les pages (dashboard, parcels, etc.)
- **Stratégie CacheFirst** pour les images et fonts
- **Cache Supabase** pour les données API (24h)

### 2. Manifeste PWA
- Nom court : "AgroSphere"
- Icônes : 192x192, 512x512
- Couleur thème : Vert (#16a34a)
- Raccourcis : Dashboard, Parcelles, Diagnostic, Marketplace

### 3. Composants UI
- **PWAInstallPrompt** : Invite l'utilisateur à installer l'app
- **OfflineIndicator** : Affiche une bannière quand hors ligne
- **ScrollToTop** : Bouton retour en haut sur homepage et dashboard

---

## 🧪 Comment tester le mode hors ligne

### Étape 1 : Attendre le déploiement Vercel
Le déploiement est en cours. Dans ~2-3 minutes, l'application sera mise à jour sur :
```
https://AgroSphere2.vercel.app
```

### Étape 2 : Installer l'application sur mobile

**Sur Android (Chrome) :**
1. Ouvre `https://AgroSphere2.vercel.app` dans Chrome
2. Une bannière apparaît : "Installer AgroSphere"
3. Clique sur **"Installer"**
4. L'app apparaît sur ton écran d'accueil

**Sur iPhone (Safari) :**
1. Ouvre `https://AgroSphere2.vercel.app` dans Safari
2. Appuie sur le bouton **Partager** (carré avec flèche vers le haut)
3. Choisis **"Sur l'écran d'accueil"**
4. Nomme l'app "AgroSphere" et valide

### Étape 3 : Tester le mode hors ligne

1. **Ouvre l'application** (depuis l'écran d'accueil)
2. **Connecte-toi** si nécessaire
3. **Navigue** sur Dashboard, Parcelles, etc. (pour mettre en cache)
4. **Active le mode avion** ou désactive les données mobiles
5. **Rafraîchis la page** → L'app doit fonctionner !

**Ce qui fonctionne hors ligne :**
- ✅ Pages déjà visitées (cache NetworkFirst)
- ✅ Assets statiques (JS, CSS, images)
- ✅ Polices Google Fonts
- ✅ Interface utilisateur complète

**Ce qui NE fonctionne PAS hors ligne :**
- ❌ Nouvelles requêtes Supabase (création parcelle, etc.)
- ❌ Diagnostic IA (nécessite API Gemini)
- ❌ Envoi de nouvelles données

---

## 🔧 Personnalisation

### Changer la stratégie de cache

Dans `vite.config.ts`, section `workbox.runtimeCaching` :

```typescript
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
  handler: 'NetworkFirst', // Change à 'CacheFirst' pour plus d'offline
  options: {
    cacheName: 'supabase-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 // 24 hours
    }
  }
}
```

**Stratégies disponibles :**
- `CacheFirst` : Cache d'abord, réseau si pas en cache (meilleur offline)
- `NetworkFirst` : Réseau d'abord, cache si offline (données fraîches)
- `StaleWhileRevalidate` : Cache immédiatement, met à jour en background

### Ajouter plus de pages au cache

Dans `vite.config.ts` :

```typescript
{
  urlPattern: /\/(dashboard|parcels|diagnose|NEW_PAGE).*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 10 // Attend 10s avant de servir le cache
  }
}
```

---

## 🎯 Prochaines améliorations possibles

1. **Cache des données Supabase** : Mettre en cache les résultats de requêtes fréquentes
2. **Sync en background** : File d'attente pour les actions hors ligne (ex: créer parcelle → sync quand online)
3. **Notifications push** : Rappels pour les récoltes, alertes météo
4. **Versioning du cache** : Nettoyer automatiquement l'ancien cache après mise à jour

---

## 🐛 Dépannage

### L'application ne se met pas à jour ?
1. Va dans `chrome://serviceworker-internals` (Chrome Android)
2. Trouve "AgroSphere2.vercel.app"
3. Clique sur **"Unregister"**
4. Rafraîchis la page

### Le prompt d'installation n'apparaît pas ?
1. Vérifie que tu es en **HTTPS** (obligatoire pour PWA)
2. Attends quelques secondes après le chargement
3. Ferme et rouvre l'app

### Hors ligne ne fonctionne pas ?
1. Visite toutes les pages **en étant connecté** d'abord
2. Attends que le service worker soit installé (environ 30s)
3. Active le mode avion
4. Rafraîchis (pull-to-refresh)

---

## 📊 État actuel

| Fonctionnalité | Statut |
|---------------|--------|
| Service Worker | ✅ Actif |
| Manifeste PWA | ✅ Configuré |
| Cache assets | ✅ JS/CSS/HTML/Fonts |
| Cache images | ✅ 30 jours |
| Cache API Supabase | ✅ 24 heures |
| Prompt installation | ✅ UI prête |
| Indicateur offline | ✅ Bannière auto |
| Raccourcis app | ✅ 4 raccourcis |

---

**Dernière mise à jour :** 2026-07-31  
**Commit :** `ff15b26`  
**Version PWA :** 1.0
