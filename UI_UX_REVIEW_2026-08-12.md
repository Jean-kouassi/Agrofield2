# 🎨 AgroSphere2 — UI/UX Review Complet

**Date:** 2026-08-12 15:00 GMT  
**Scope:** Marketplace + routes authentifiées  
**Méthode:** Analyse statique composants + conformité design system  

---

## 📋 Vue d'Ensemble

### ✅ Points Forts

1. **Architecture UI solide**
   - 58 composants shadcn/ui installés
   - Design system tokenisé (Tailwind 4 + CSS custom properties)
   - Palette agricole cohérente (vert forêt #166534, ocre #d97706)

2. **Mobile-first correct**
   - Navigation bottom sur mobile
   - Bottom sheets pour filtres/filtres
   - Bottom nav fixe adaptée
   - Cards responsive grid

3. **PWA bien configurée**
   - Prompt d'installation présent
   - Offline badge
   - 109 entrées precache

4. **Feedback utilisateur**
   - Toasts (sonner)
   - Empty states
   - Loading skeletons
   - Badges de statut colorés

---

## ⚠️ Problèmes Identifiés

### 1. Couleurs Hardcodées Non Conformes 🔴

**Violation:** `AgroSphere2_ARCHITECTURE.md` interdit `text-white`, `bg-white`, `text-black`, `bg-black`

**Fichiers concernés (30+ occurrences):**

| Fichier | Lignes | Problème |
|---------|--------|----------|
| `marketplace.messages.tsx` | Header, avatar, bulles | `bg-green-600 text-white`, `bg-white` |
| `marketplace.my-offers.tsx` | Header, badges | `bg-green-600 text-white`, `bg-white` |
| `marketplace.orders.tsx` | Header, badges | `bg-green-600 text-white`, `bg-white` |
| `finances.credit.tsx` | CardHeader | `bg-gradient-to-r ... text-white` |
| `buyer-dashboard.tsx` | Boutons | `bg-orange-500`, etc. |
| `product-card.tsx` | Image placeholder | `bg-gray-100` |
| `messages-view.tsx` | Bulles chat | `text-white`, `bg-white` |

**Solution:** Remplacer par tokens sémantiques:
```tsx
// ❌ Avant
className="bg-green-600 text-white"

// ✅ Après
className="bg-[var(--agro-primary)] text-primary-foreground"
```

---

### 2. Headers Doublons / Non Intégrés 🔴

**Constat:** Les pages `marketplace.messages.tsx`, `marketplace.my-offers.tsx`, `marketplace.orders.tsx` ont leur **propre header** au lieu d'utiliser le layout `_authenticated/route.tsx`.

**Conséquences:**
- Double header visuel sur desktop
- Logo "AgroSphere" absent sur ces pages
- Bouton "Profil" et "Quitter" manquants
- Pas de navigation adaptative par rôle

**Solution:** Supprimer les headers locaux et utiliser le layout partagé, ou harmoniser avec le layout existant.

---

### 3. Responsiveness: Pages sans `max-w` 🟡

**Fichiers concernés:**
- `admin.tsx` → pleine largeur, risque de texte trop long
- `dashboard.tsx` → pas de max-w visible
- `finance.tsx` → pas de max-w visible
- `create-offer.tsx` → page legacy orpheline

**Recommandation:**
```tsx
// Ajouter un container standard
<main className="mx-auto w-full max-w-3xl px-4 py-5">
```

---

### 4. Formulaires: Labels non associés aux inputs 🟡

**Fichier:** `publish-modal.tsx` (création d'offre)  
**Erreur console:** "A form field element should have an id or name attribute"  
**Erreur console:** "No label associated with a form field"

**Solution:** Ajouter:
- `id` et `name` sur tous les inputs/select/textarea
- `htmlFor` sur les labels correspondants
- Attributs `required`, `min`, `max` pour validation native

**Guide déjà créé:** `FIX_FORM_ACCESSIBILITY.md`

---

### 5. Route Orpheline `create-offer.tsx` 🟡

**Fichier:** `src/routes/create-offer.tsx`  
**Problème:** Page publique de création d'offre alors que le marketplace est authentifié  
**Impact:** Potentielle faille de sécurité + confusion UX

**Solution:** Supprimer ou rediriger vers `/marketplace/create`

---

### 6. Accessibilité (a11y) 🟡

**Problèmes détectés:**
- Plusieurs boutons sans `aria-label`
- Images sans `alt` descriptif (avatars par défaut)
- Contraste insuffisant sur certains boutons secondaires
- Pas de `skip-to-content` link
- Pas de focus trap dans les modals

**Recommandations:**
- Ajouter `aria-label` aux icon buttons
- Utiliser `VisuallyHidden` pour labels supplémentaires
- Tester avec axe-core ou Lighthouse

---

### 7. Bottom Navigation Inutilisée / Doublon 🟡

**Fichiers:**
- `src/components/ui/bottom-nav.tsx` existe
- Mais le layout principal `_authenticated/route.tsx` a sa propre bottom nav

**Recommandation:**
- Décider de l'une ou l'autre implémentation
- Supprimer le doublon ou documenter son usage

---

### 8. Composants Marketplace: Complexité Élevée 🟡

| Composant | Lignes | Note |
|-----------|--------|------|
| `publish-modal.tsx` | ~400+ | Multi-step wizard dense |
| `orders-view.tsx` | ~450+ | Logique + UI + modals |
| `product-detail-modal.tsx` | ~300+ | Beaucoup d'infos |
| `messages-view.tsx` | ~300+ | Chat + liste |

**Recommandation:** Refactoriser en sous-composants (<200 lignes chacun)

---

## 🎨 Suggestions d'Amélioration

### A. Harmonisation Visuelle

#### Créer un Header Global Unique
```tsx
// Utiliser le layout _authenticated/route.tsx pour TOUTES les pages authentifiées
// Supprimer les headers locaux dans marketplace.*.tsx
```

#### Standardiser les Badges de Statut
```tsx
// Créer un composant unique status-badge.tsx utilisant des variants shadcn
<Badge variant="available">Disponible</Badge>
<Badge variant="reserved">Réservé</Badge>
<Badge variant="sold">Épuisé</Badge>
```

---

### B. Améliorations Mobile

#### 1. Pull-to-Refresh
Ajouter sur les listes longues:
```tsx
// Hook ou composant PullToRefresh
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
```

#### 2. Skeleton amélioré
Créer des skeletons ressemblant aux vraies cartes (même hauteur/largeur)

#### 3. Haptic Feedback
Sur les boutons d'action principaux (mobile native):
```tsx
if (window.navigator.vibrate) {
  window.navigator.vibrate(50)
}
```

---

### C. Nouveaux Composants Proposés

#### 1. `MobileHeader.tsx`
Header simple pour pages authentifiées si layout global pas adapté:
```tsx
<MobileHeader title="Mes commandes" backTo="/marketplace" />
```

#### 2. `StatusBadge.tsx`
Badge unifié pour tous les statuts:
```tsx
<StatusBadge status="available" />
```

#### 3. `FormField.tsx`
Champ de formulaire accessible avec label + erreur + hint:
```tsx
<FormField
  id="offer-title"
  label="Titre"
  hint="100 caractères max"
  error={errors.title}
  input={<Input id="offer-title" name="title" />}
/>
```

#### 4. `EmptyState.tsx`
Composant déjà existe ! L'utiliser partout au lieu des implémentations locales.

#### 5. `SectionTitle.tsx`
Titres de section standardisés:
```tsx
<SectionTitle icon={ShoppingBag}>Mes commandes</SectionTitle>
```

#### 6. `PriceTag.tsx`
Affichage prix FCFA standardisé:
```tsx
<PriceTag amount={5000} unit="kg" />
```

---

## ♿ Plan d'Accessibilité

### Court Terme (1 semaine)
- [ ] Ajouter id/name/htmlFor sur tous les formulaires
- [ ] Ajouter aria-label sur les icon buttons
- [ ] Corriger les couleurs hardcodées (contraste)
- [ ] Ajouter alt sur les images

### Moyen Terme (2 semaines)
- [ ] Audit Lighthouse a11y sur chaque page
- [ ] Ajouter skip-to-content link
- [ ] Gérer focus trap dans modals
- [ ] Tester navigation clavier complète

### Long Terme (1 mois)
- [ ] Tests avec lecteur d'écran
- [ ] Traductions pour langues locales
- [ ] Mode daltonien testé

---

## 📱 Responsive Review

| Page | Mobile | Desktop | Note |
|------|--------|---------|------|
| `/dashboard` | ✅ | ✅ | Cards en grid |
| `/parcels` | ✅ | ✅ | Formulaire modal OK |
| `/sensors` | ✅ | ⚠️ | Graphiques peut-être trop larges |
| `/marketplace` | ✅ | ✅ | Grid adaptatif |
| `/marketplace/:id` | ✅ | ✅ | max-w-3xl |
| `/marketplace/messages` | ✅ | ✅ | 1 col mobile / 3 col desktop |
| `/marketplace/orders` | ✅ | ✅ | max-w-4xl |
| `/marketplace/my-offers` | ✅ | ✅ | max-w-4xl |
| `/finance` | ✅ | ⚠️ | Vérifier tableaux |
| `/finances/credit` | ✅ | ✅ | max-w-5xl |

---

## 🎯 Priorités d'Action

### 🔴 URGENT (Cette semaine)
1. Corriger couleurs hardcodées marketplace
2. Supprimer/Intégrer headers doublons
3. Corriger accessibilité formulaire création d'offre

### 🟡 MOYEN (2 semaines)
4. Harmoniser badges de statut
5. Créer composants `FormField`, `StatusBadge`, `PriceTag`
6. Audit responsive pages sans max-w

### 🟢 AMÉLIORATION (1 mois)
7. Refactoriser composants marketplace trop longs
8. Ajouter pull-to-refresh mobile
9. Audit accessibilité complet

---

## 📊 Score UI/UX Provisoire

| Critère | Score /10 | Commentaire |
|---------|-----------|-------------|
| Cohérence visuelle | 6 | Couleurs hardcodées à corriger |
| Responsive | 8 | Globalement bon |
| Accessibilité | 4 | Labels/formulaires problématiques |
| Mobile-first | 8 | Bottom nav, FAB, modals OK |
| Composants réutilisables | 6 | Doublons et composants trop longs |
| Feedback utilisateur | 8 | Toasts, skeletons, empty states OK |
| **Moyenne** | **6.7/10** | **Bon, mais nécessite polissage** |

---

## 📎 Fichiers Liés

- `src/components/ui/` — Composants shadcn/ui
- `src/components/marketplace/` — Composants marketplace
- `src/styles.css` — Design system
- `src/routes/_authenticated/route.tsx` — Layout principal
- `FIX_FORM_ACCESSIBILITY.md` — Correction formulaire

---

**Prochaine action recommandée:**  
Appliquer les corrections d'accessibilité sur le formulaire de création d'offre, puis harmoniser les headers et couleurs marketplace.

**Généré par:** OpenClaw Design Agent  
**Date:** 2026-08-12 15:00 GMT
