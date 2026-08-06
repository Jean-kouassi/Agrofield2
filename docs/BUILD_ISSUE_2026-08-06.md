# 🔴 Build Issue - TanStack Start Router Plugin

**Date:** 2026-08-06  
**Statut:** Bloquant pour déploiement  
**Commit affecté:** `6a73d56`  

---

## Problème

```
Error: Crawling result not available
at LoadPluginContextImpl.handler 
    (tanstack-start-plugin-core/dist/esm/vite/start-router-plugin/plugin.js:69:32)
```

Le build échoue systématiquement avec cette erreur depuis l'ajout des modifications:
- Debug reçus (`finance.tsx`)
- Gesture swipe (`swipe-gesture.ts`, `parcels.tsx`, `diagnose.tsx`)

---

## Investigation

### Ce qui a été testé:

1. ❌ Build avec code original → ✅ Fonctionne
2. ❌ Build avec nouvelles modifications → ❌ Échec
3. ❌ Ajout `TANSTACK_START_SKIP_ROUTE_CRAWLING=true` → Toujours échec
4. ❌ Config `generateRouteTree: false` → Toujours échec
5. ✅ Rollback commit `33b89fd` → Build OK

### Hypothèses:

1. **Fichier route supprimé/modifié** qui casse le crawler
2. **Conflit entre plugins Vite** (PWA + TanStack Start)
3. **Bug version récente** @tanstack/start-plugin-core

---

## Solution Temporaire

Déployer avec commit stable `33b89fd`:

```bash
git checkout 33b89fd -- .
npm run build
npx wrangler pages deploy dist --project-name agrofield2 --branch main
git checkout main -- .
```

URL déployée: https://52e1835d.agrofield2.pages.dev

---

## Solutions Permanentes à Explorer

### Option 1: Downgrade TanStack Start
```bash
npm install @tanstack/react-start@1.168.x @tanstack/start@1.120.x
```

### Option 2: Mode SPA (désactiver SSR)
Modifier `vite.config.ts`:
```typescript
tanstackStart: {
  server: false, // Désactiver SSR
}
```

### Option 3: Fix manuel route tree
Générer manuellement le fichier de routes:
```bash
npx tsr generate
```

### Option 4: Attendre fix upstream
Ouvrir issue GitHub sur tanstack/router

---

## Impact

- ✅ Code fonctionnel localement (dev)
- ❌ Impossible de build en production
- ⚠️ Corrections reçues et gesture swipe non déployées

---

## Prochaines Actions

1. [ ] Tester Option 1 (downgrade)
2. [ ] Si échec → Option 2 (SPA mode)
3. [ ] Documenter solution dans AGENTS.md
4. [ ] Déployer corrections une fois build fixé

---

**Mis à jour par:** OpenClaw Assistant  
**Priorité:** 🔴 Haute (bloque déploiement)
