# AgroField2 - UX/UI Guidelines

## 🎯 Principes Fondamentaux

### 1. Navigation Cohérente
**Pattern Marketplace → Toutes les pages**

```tsx
// Header sticky avec retour + branding
<header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b" style={{ borderColor: 'var(--agro-border)' }}>
  <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
    {/* Bouton retour TOUJOURS présent */}
    <Link to="/" className="flex items-center gap-1.5 ...">
      <ArrowLeft size={18} />
      <span className="hidden sm:inline">Accueil</span>
    </Link>
    
    {/* Séparateur vertical */}
    <div className="w-px h-6" style={{ background: 'var(--agro-border)' }} />
    
    {/* Logo + Titre */}
    <Link to="/" className="w-9 h-9 ...">
      <img src="/favicon.ico" alt="AgroField" />
    </Link>
    <div>
      <div className="af-display font-extrabold text-base">Titre Page</div>
      <div className="text-xs text-muted-foreground">Sous-titre optionnel</div>
    </div>
  </div>
</header>
```

### 2. Tokens de Design System (OBLIGATOIRES)

**Couleurs sémantiques - JAMAIS de couleurs hardcodées :**
- `--agro-primary` (#166534) - Actions principales, liens
- `--agro-primary-light` (#22c55e) - Accents, succès
- `--agro-primary-dark` (#14532d) - Hover states
- `--agro-accent` (#d97706) - Call-to-action secondaires
- `--agro-ink` (#14231a) - Texte principal
- `--agro-muted` (#5b6e60) - Texte secondaire
- `--agro-border` (#dce8dd) - Bordures, séparateurs
- `--agro-pale` (#f0fdf4) - Fonds légers
- `--agro-card` (#ffffff) - Cartes
- `--agro-danger` (#dc2626) - Erreurs, alertes

**À FAIRE :**
```tsx
style={{ color: 'var(--agro-primary)', borderColor: 'var(--agro-border)' }}
className="text-[var(--agro-ink)] bg-[var(--agro-pale)]"
```

**À ÉVITER :**
```tsx
className="text-green-800 bg-green-50 border-gray-200" // ❌ Hardcodé
```

### 3. Typographie

**Titres :** Utiliser `af-display` (Sora) pour les titres impactants
```tsx
<h1 className="af-display font-extrabold text-2xl md:text-4xl">Titre</h1>
```

**Corps de texte :** Inter par défaut
```tsx
<p className="text-sm md:text-base text-muted-foreground">Description</p>
```

**Hiérarchie :**
- H1: `text-2xl md:text-4xl font-extrabold` (af-display)
- H2: `text-xl md:text-2xl font-bold` (af-display)
- H3: `text-lg font-semibold`
- Corps: `text-sm md:text-base`
- Caption: `text-xs text-muted-foreground`

### 4. Composants Réutilisables

#### Cards
```tsx
<Card className="af-card rounded-xl p-4 hover:shadow-lg transition-all">
  <CardContent>
    {/* Contenu */}
  </CardContent>
</Card>
```

#### Buttons
```tsx
// Primaire
<Button className="af-btn-primary rounded-lg px-4 py-2 font-bold">
  Action
</Button>

// Secondaire/Accent
<Button className="af-btn-accent rounded-lg px-4 py-2 font-bold">
  Action importante
</Button>

// Ghost
<Button className="af-btn-ghost rounded-lg px-4 py-2">
  Annuler
</Button>
```

#### Chips/Filtres
```tsx
<button className="af-chip rounded-full px-3 py-1 text-sm">
  Filtre
</button>
<button className="af-chip af-chip-active rounded-full px-3 py-1 text-sm">
  Filtre actif
</button>
```

#### Badges
```tsx
<span className="af-badge-available rounded-full px-2 py-0.5 text-xs font-medium">
  Disponible
</span>
```

### 5. Patterns d'Interaction

#### Loading States
Utiliser les skeletons animés :
```tsx
<div className="af-skeleton rounded-lg h-20 w-full" />
```

#### Empty States
Toujours fournir un CTA clair :
```tsx
<EmptyState
  icon={<Sprout size={48} />}
  title="Aucune parcelle"
  description="Commencez par ajouter votre première parcelle"
  action={<Button>Ajouter une parcelle</Button>}
/>
```

#### Feedback Utilisateur
- **Succès :** Toast vert avec icône ✓
- **Erreur :** Toast rouge avec message explicatif
- **Confirmation :** Modal pour actions destructrices

#### Navigation Mobile
- Bottom navigation bar fixe sur mobile
- Hamburger menu sur desktop si >5 items
- Bouton retour toujours visible

### 6. Accessibilité

- Contraste minimum 4.5:1 pour le texte
- Focus visible sur tous les éléments interactifs
- Labels ARIA sur les boutons icon-only
- Support clavier complet

### 7. Performance

- Images optimisées (WebP, lazy loading)
- Skeletons pendant le chargement
- Pagination pour listes longues (>20 items)
- Virtual scrolling pour très longues listes

---

## 📋 Checklist avant déploiement

- [ ] Header cohérent avec bouton retour
- [ ] Tokens AgroField utilisés (pas de couleurs hardcodées)
- [ ] Typographie hiérarchisée (af-display pour titres)
- [ ] Loading states avec skeletons
- [ ] Empty states avec CTA
- [ ] Feedback utilisateur (toasts)
- [ ] Responsive mobile tested
- [ ] Accessibilité (contraste, focus, ARIA)
- [ ] Performance (images optimisées)

---

## 🎨 Exemples de Pages

### Dashboard
- Stats cards en haut
- Activités récentes (timeline)
- Alertes prioritaires
- Weather widget

### Liste (Parcelles, Capteurs, Finances)
- Header avec titre + CTA
- Filters/chips en haut
- Grid/List toggle
- Pagination infinite scroll
- FAB pour ajout rapide (mobile)

### Détail
- Breadcrumb ou bouton retour
- Informations principales en haut
- Sections organisées par cartes
- Actions contextuelles

### Formulaire
- Progress indicator si multi-étapes
- Validation en temps réel
- Sauvegarde brouillon auto
- Confirmation avant submit

---

**Dernière mise à jour:** 2026-08-10  
**Appliqué à:** Marketplace ✅  
**À appliquer:** Dashboard, Parcelles, Capteurs, Finances, Diagnostic
