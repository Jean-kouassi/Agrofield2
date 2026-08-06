# 👆 Gesture Swipe Style Facebook - Guide d'Implémentation

**Date:** 2026-08-06  
**Objectif:** Swipe fluide et réaliste comme Facebook/Instagram

---

## 🎯 Caractéristiques du Swipe "Réaliste"

### Ce qui fait la différence:

1. **Suivi du doigt en temps réel**
   - La page suit exactement ton doigt pendant le gesture
   - Pas de détection binaire (swipe/no-swipe)
   - Animation fluide à 60fps

2. **Résistance progressive**
   - Plus tu vas loin, plus c'est "lourd"
   - Effet physique réaliste (ressort)

3. **Feedback visuel**
   - Opacité qui diminue (80-100%)
   - Scale léger (95-100%)
   - Rotation subtile (±2°)

4. **Seuil intelligent**
   - 30% de l'écran (pas 50px fixes)
   - Adaptatif selon la taille de l'appareil
   - Téléphone: ~120px | Tablette: ~240px

5. **Animation de sortie**
   - Si seuil atteint → transition fluide vers nouvelle page
   - Si seuil non atteint → retour élastique (spring)

---

## 📐 Formules Physiques

```typescript
// Distance minimale (30% écran)
const threshold = screenWidth * 0.3;

// Résistance (la page va moins vite que ton doigt)
const resistance = 0.8;
const translateX = (touchCurrent - touchStart) * resistance;

// Opacité décroissante (plus on swipe, plus transparent)
const maxDrag = screenWidth * 0.7;
const opacity = 1 - (Math.abs(diff) / maxDrag) * 0.3;
// Ex: diff=0 → opacity=1.0 | diff=maxDrag → opacity=0.7

// Scale subtil pour profondeur
const scale = 1 - (Math.abs(diff) / maxDrag) * 0.05;
// Ex: diff=0 → scale=1.0 | diff=maxDrag → scale=0.95

// Rotation légère
const rotate = (diff / maxDrag) * 2; // ±2 degrés

// Courbe bezier pour effet de ressort (CSS)
transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
// Cette courbe donne un effet "bounce" naturel
```

---

## 🔧 Implémentation Technique

### Structure des événements:

```typescript
onTouchStart:
  - Sauvegarder position initiale (touchStartX)
  - Initialiser touchCurrentX
  - Flag isSwiping = true

onTouchMove:
  - Mettre à jour touchCurrentX
  - Calculer diff = current - start
  - Appliquer transform CSS en temps réel:
    - translateX(diff * resistance)
    - opacity(1 - abs(diff)/maxDrag * 0.3)
    - transition: 'none' (pour suivi parfait)

onTouchEnd:
  - Calculer diff final
  - Si abs(diff) > threshold:
    → Navigation + animation de sortie
  - Sinon:
    → Reset avec effet de ressort
```

---

## 🎨 Courbes de Bézier pour Animations

### Ressort / Retour élastique:
```css
cubic-bezier(0.34, 1.56, 0.64, 1)
```
- Dépasse légèrement la cible avant de revenir
- Donne un effet "bounce" naturel

### Smooth ease-out:
```css
cubic-bezier(0.25, 0.46, 0.45, 0.94)
```
- Démarrage rapide, fin douce
- Bon pour les transitions de pages

### Linear (suivi doigt):
```css
transition: 'none'
```
- Aucun lissage pendant le drag
- Le doigt contrôle directement la position

---

## 📱 Exemple Complet

```tsx
<div
  onTouchStart={(e) => {
    window._swipeStartX = e.targetTouches[0].clientX;
    window._swipeCurrentX = window._swipeStartX;
  }}
  onTouchMove={(e) => {
    const touch = e.targetTouches[0];
    if (window._swipeStartX == null) return;
    
    window._swipeCurrentX = touch.clientX;
    const diff = window._swipeCurrentX - window._swipeStartX;
    const resistance = 0.8;
    const maxDrag = window.innerWidth * 0.7;
    
    const elem = e.currentTarget as HTMLElement;
    elem.style.transform = `translateX(${diff * resistance}px)`;
    elem.style.opacity = (1 - Math.abs(diff) / maxDrag * 0.3).toString();
    elem.style.transition = 'none'; // Suivi parfait
  }}
  onTouchEnd={(e) => {
    const touch = e.changedTouches[0];
    const elem = e.currentTarget as HTMLElement;
    
    if (window._swipeStartX == null) return;
    
    const diff = window._swipeStartX - touch.clientX;
    const threshold = window.innerWidth * 0.3; // 30%
    
    if (Math.abs(diff) > threshold) {
      // Swipe validé
      elem.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      elem.style.transform = diff > 0 ? 'translateX(-100%)' : 'translateX(100%)';
      
      // Navigation après animation
      setTimeout(() => {
        if (diff > 0) navigateLeft();
        else navigateRight();
      }, 150);
    } else {
      // Reset élastique
      elem.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      elem.style.transform = '';
      elem.style.opacity = '';
    }
    
    window._swipeStartX = null;
  }}
>
  {/* Contenu de la page */}
</div>
```

---

## 🎯 Comparaison: Avant vs Après

| Aspect | Ancienne Version | Nouvelle Version Facebook-Style |
|--------|------------------|--------------------------------|
| **Détection** | Binaire (50px) | Progressive (30% écran) |
| **Feedback** | Aucun | Translation + Opacité + Scale |
| **Pendant gesture** | Rien | Suit le doigt en temps réel |
| **Animation** | Instantanée | Fluide avec courbe bezier |
| **Retour si échec** | Reset sec | Effet de ressort |
| **Ressenti** | Mécanique | Naturel/organique |

---

## ✅ Checklist Qualité

- [ ] La page suit bien le doigt pendant le swipe
- [ ] Opacité diminue progressivement (pas de saut)
- [ ] Seuil adaptatif (30% écran, pas pixels fixes)
- [ ] Animation de sortie fluide (cubic-bezier)
- [ ] Retour élastique si seuil non atteint
- [ ] Pas de lag/saccades (60fps)
- [ ] Fonctionne sur petits et grands écrans
- [ ] Support clavier conservé (flèches)

---

## 🚀 Optimisations Futures

1. **Haptic feedback** (vibration) sur mobile
   ```typescript
   if (navigator.vibrate) {
     navigator.vibrate(10); // Petite vibration au début du swipe
   }
   ```

2. **Shadow portée** pendant le swipe
   ```css
   box-shadow: 0 10px 40px rgba(0,0,0,0.2);
   ```

3. **Page suivante en preview**
   - Afficher un aperçu de la page suivante derrière
   - Effet de carte qui glisse

4. **Gesture horizontal ET vertical**
   - Swipe horizontal: navigation entre pages
   - Swipe vertical: refresh ou actions rapides

---

**Références:**
- iOS UIKit: `UISwipeGestureRecognizer`
- Android: `GestureDetector.OnGestureListener`
- React Native: `react-native-gesture-handler`
- Facebook/Instagram apps (observation)
