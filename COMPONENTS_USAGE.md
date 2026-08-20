# Composants Agricoles - Guide d'Utilisation

## 📦 Composants créés

### 1. WeatherAlertBanner
**Fichier:** `src/components/weather/WeatherAlertBanner.tsx`

Bandeau d'alerte météo agricole avec prévisions 7 jours et conseils culturaux.

```tsx
import { WeatherAlertBanner } from "@/components/weather/WeatherAlertBanner";

// Usage basique
<WeatherAlertBanner location="Ouagadougou" />

// Avec offline detection
<WeatherAlertBanner 
  location="Bobo-Dioulasso" 
  isOffline={!navigator.onLine}
  onDismiss={() => console.log("Banner dismissed")}
/>

// Coordonnées personnalisées
<WeatherAlertBanner 
  latitude={12.37} 
  longitude={-1.52} 
  location="Zone rurale"
/>
```

**Features:**
- Prévisions 7 jours (API open-meteo.com gratuite)
- Alertes automatiques (forte pluie, orage, vent, sécheresse)
- Conseils culturaux contextuels
- Mode offline avec données mises en cache
- Dismissible (ne réaffiche pas pendant 12h)
- Villes supportées: Ouaga, Bobo, Banfora, Koudougou

---

### 2. CropCalendarStrip
**Fichier:** `src/components/agriculture/CropCalendarStrip.tsx`

Calendrier cultural visuel horizontal avec 5 phases.

```tsx
import { CropCalendarStrip } from "@/components/agriculture/CropCalendarStrip";

// Usage basique
<CropCalendarStrip 
  cropType="mais"
  plantingDate="2026-07-15"
/>

// Avec jour override + callback
<CropCalendarStrip
  cropType="mil"
  plantingDate="2026-06-01"
  currentDay={45}
  onPhaseClick={(phase, info) => console.log(phase, info)}
/>

// Culture personnalisée
<CropCalendarStrip cropType="riz" plantingDate="2026-07-01" />
```

**Cultures supportées:**
| Culture | Durée (jours) |
|---------|--------------|
| Mil | 90 |
| Sorgho | 120 |
| Maïs | 100 |
| Riz | 140 |
| Coton | 160 |
| Arachide | 110 |
| Niébé | 75 |

**Phases:**
1. 🌱 Semis → 2. 📈 Croissance → 3. 🌸 Floraison → 4. 🌾 Maturation → 5. ✂️ Récolte

---

### 3. MarketPriceTicker
**Fichier:** `src/components/marketplace/MarketPriceTicker.tsx`

Prix marchés agricoles en temps réel avec sparkline 30 jours.

```tsx
import { MarketPriceTicker } from "@/components/marketplace/MarketPriceTicker";

// Usage basique
<MarketPriceTicker />

// Marchés et produits personnalisés
<MarketPriceTicker
  markets={["Ouaga", "Bobo"]}
  products={["Tomate", "Oignon", "Maïs"]}
  refreshIntervalMs={10 * 60 * 1000}
  isOffline={false}
/>

// Intégration dashboard
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <MarketPriceTicker />
  <WeatherAlertBanner />
</div>
```

**Marchés supportés:** Ouaga, Bobo, Banfora, Koudougou
**Produits:** Tomate, Oignon, Maïs, Mil, Sorgho, Riz local
**Unité:** FCFA/kg

---

## 🎨 Tokens CSS ajoutés

Ajoutés dans `src/styles.css`:

```css
/* Crop calendar phases */
--color-phase-seeding: oklch(0.7 0.12 145);     /* vert clair */
--color-phase-growing: oklch(0.55 0.14 145);    /* vert foncé */
--color-phase-flowering: oklch(0.75 0.15 75);   /* ocre */
--color-phase-maturation: oklch(0.65 0.12 50);  /* brun */
--color-phase-harvest: oklch(0.55 0.18 27);     /* rouge terre */

/* Weather alert severities */
--color-weather-info: var(--accent);
--color-weather-warning: var(--primary);
--color-weather-critical: var(--destructive);

/* Small screen optimizations (iPhone SE) */
@media (max-width: 375px) {
  .text-display { font-size: 1.25rem; }
  .touch-target, button, a.button { min-height: 48px; }
}
```

---

## ✅ Conformité Design System

- ✅ Tokens sémantiques uniquement (pas de couleurs hardcodées)
- ✅ Composants shadcn réutilisés (Card, Badge)
- ✅ Icônes Lucide React (pas d'emojis)
- ✅ Touch targets 48px+ minimum
- ✅ ARIA labels sur tous les boutons interactifs
- ✅ Responsive mobile-first (375px → desktop)
- ✅ Mode offline géré sur tous les composants
- ✅ TypeScript strict avec types exportés

---

## 🚀 Intégration recommandée - Dashboard

```tsx
// src/routes/dashboard.tsx
import { WeatherAlertBanner } from "@/components/weather/WeatherAlertBanner";
import { CropCalendarStrip } from "@/components/agriculture/CropCalendarStrip";
import { MarketPriceTicker } from "@/components/marketplace/MarketPriceTicker";

export function Dashboard() {
  return (
    <div className="space-y-4 p-4">
      {/* Météo en haut - alertes critiques */}
      <WeatherAlertBanner location="Ouagadougou" />
      
      {/* Calendrier cultural si parcelle active */}
      <CropCalendarStrip 
        cropType="mais" 
        plantingDate="2026-07-15" 
      />
      
      {/* Prix marchés */}
      <MarketPriceTicker />
    </div>
  );
}
```