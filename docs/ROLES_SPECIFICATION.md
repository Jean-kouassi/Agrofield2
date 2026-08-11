# AgroField2 — Spécification des Rôles & Types d'Utilisateurs

> **Version:** 1.0  
> **Date:** 2026-08-11  
> **Statut:** Spécification de référence  
> **Auteur:** OpenClaw + Kouassi

---

## 1. Vue d'Ensemble

AgroField2 est une plateforme agricole pour l'Afrique de l'Ouest (Burkina Faso, Mali, Niger, Bénin, Togo). Elle connecte les **producteurs agricoles** aux **acheteurs** (grossistes et détaillants) via un marketplace, tout en offrant des outils de gestion (parcelles, capteurs IoT, diagnostic IA, finances, credit scoring).

### 1.1 Principes Directeurs

- **L'agriculteur est au centre** — l'application est priorisée pour les producteurs
- **Accès conditionnel** — chaque rôle voit uniquement ce qui le concerne
- **Sécurité RLS** — les policies Supabase filtrent les données par rôle
- **UI adaptative** — la navigation s'adapte au rôle de l'utilisateur
- **Bilingue** — interface en français, noms locaux pour cultures et régions

---

## 2. Définition des Rôles

### 2.1 Rôle `producer` — Agriculteur-Producteur

**Description:** Cultive des champs, élève des animaux, ou produit des biens agricoles. C'est le rôle principal.

**Profil type:**
- Agriculteur individuel ou membre de coopérative
- Possède 1-10 parcelles (0.5 à 20 hectares)
- Cultive: Mil, Sorgho, Maïs, Riz, Coton, Arachide, Niébé, Sésame, Tomate, Oignon, Chou
- Équipement: Android entrée de gamme, 2G/3G, offline fréquent
- Revenus: Vente de récoltes sur le marketplace

**Accès pages:**

| Page | Accès | Description |
|------|-------|-------------|
| Dashboard | ✅ | Stats parcelles + alertes + finances + météo |
| Parcelles | ✅ CRUD | Créer, voir, modifier, supprimer ses parcelles |
| Capteurs IoT | ✅ CRUD | Enregistrer et gérer ses devices, voir lectures |
| Diagnostic IA | ✅ | Analyser photos de plantes, historique |
| Marketplace | ✅ Complet | Publier offres, vendre, voir commandes, messagerie |
| Finances | ✅ | Dépenses + ventes + preuves + export |
| Credit Scoring | ✅ | Score de crédit + demande de prêt |
| Messagerie | ✅ | Discuter avec acheteurs |
| Profil | ✅ | Gérer son profil, coopérative, certifications |

**Données propriétaires:**
- Parcelles (owner = user_id)
- Capteurs (owner = user_id)
- Offres marketplace (seller_id = user_id)
- Transactions financières (user_id = user_id)
- Analyses diagnostic (user_id = user_id)

**Navigation principale (mobile):**
```
[Accueil] [Parcelles] [Capteurs] [Diagnostic] [Marketplace]
```

---

### 2.2 Rôle `wholesaler` — Acheteur Grossiste

**Description:** Achète en grande quantité directement aux producteurs. Revend aux détaillants ou exporte.

**Profil type:**
- Commerçant, exportateur, gestionnaire de coopérative
- Achète 500kg - 10t par commande
- Critères: prix, qualité, volume, région, délai de livraison
- Équipement: Smartphone moyen de gamme, 3G/4G
- Revenus: Marge sur revente

**Accès pages:**

| Page | Accès | Description |
|------|-------|-------------|
| Dashboard | ✅ | Stats achats + commandes en cours + dépenses |
| Parcelles | ❌ | Pas de gestion de parcelles |
| Capteurs IoT | ❌ | Pas de capteurs |
| Diagnostic IA | ❌ | Pas de diagnostic |
| Marketplace | ✅ Achat | Parcourir, contacter, commander en gros |
| Finances | ✅ | Dépenses d'achat (preuves) + suivi budget |
| Credit Scoring | ✅ | Score basé sur historique d'achats |
| Messagerie | ✅ | Discuter avec producteurs |
| Profil | ✅ | Gérer profil entreprise, zones d'achat |

**Données propriétaires:**
- Commandes marketplace (buyer_id = user_id)
- Transactions financières (user_id = user_id, kind = 'expense')
- Messages (participant)

**Navigation principale (mobile):**
```
[Accueil] [Marketplace] [Commandes] [Messagerie] [Finances]
```

---

### 2.3 Rôle `retailer` — Acheteur Détaillant

**Description:** Achète en petite quantité pour consommation ou revente locale (marché de quartier, restauration).

**Profil type:**
- Restaurateur, gérant de boutique, ménage
- Achète 5kg - 100kg par commande
- Critères: proximité, prix, fraîcheur
- Équipement: Smartphone basique, 2G/3G
- Revenus: Auto-consommation ou petite revente

**Accès pages:**

| Page | Accès | Description |
|------|-------|-------------|
| Dashboard | ✅ | Stats achats + commandes récentes |
| Parcelles | ❌ | Pas de gestion de parcelles |
| Capteurs IoT | ❌ | Pas de capteurs |
| Diagnostic IA | ❌ | Pas de diagnostic |
| Marketplace | ✅ Achat | Parcourir, contacter, commander petit volume |
| Finances | ✅ Basique | Dépenses d'achat (simplifié) |
| Credit Scoring | ✅ | Score basique |
| Messagerie | ✅ | Discuter avec producteurs |
| Profil | ✅ | Gérer profil simple |

**Navigation principale (mobile):**
```
[Accueil] [Marketplace] [Commandes] [Messagerie] [Profil]
```

---

### 2.4 Rôle `admin` — Administrateur

**Description:** Gère la plateforme, modère le marketplace, gère les utilisateurs.

**Accès pages:**

| Page | Accès | Description |
|------|-------|-------------|
| Dashboard | ✅ | Stats globales (utilisateurs, transactions, alertes) |
| Admin | ✅ | Gestion utilisateurs, modération offres, statistiques |
| Marketplace | ✅ Modération | Valider/suspendre offres, gérer litiges |
| Finances | ✅ Vue globale | Agrégat toutes les transactions |
| Toutes pages | ✅ Lecture | Accès en lecture sur tout |

---

### 2.5 Rôle `cooperative_manager` — Gestionnaire de Coopérative

**Description:** Gère une coopérative agricole, peut publier des offres au nom de membres.

**Accès pages:**

| Page | Accès | Description |
|------|-------|-------------|
| Dashboard | ✅ | Stats coopérative (membres, parcelles, production) |
| Parcelles | ✅ Vue coopérative | Voir les parcelles des membres |
| Capteurs IoT | ✅ Vue coopérative | Voir les capteurs des membres |
| Marketplace | ✅ Complet | Publier offres au nom de la coopérative |
| Finances | ✅ Vue coopérative | Transactions de la coopérative |
| Membres | ✅ | Gérer les membres de la coopérative |

---

## 3. Schéma Base de Données

### 3.1 Extension de l'enum `app_role`

```sql
-- Étendre l'enum existant
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wholesaler';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'retailer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cooperative_manager';
```

### 3.2 Table `profiles` (extension)

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'producer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_type text; -- 'individual', 'cooperative', 'company'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
```

### 3.3 Politiques RLS par Rôle

```sql
-- Parcelles: seulement les producteurs voient leurs parcelles
CREATE POLICY "parcels_select_owner" ON public.parcels
  FOR SELECT USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'cooperative_manager')
    )
  );

CREATE POLICY "parcels_insert_producer" ON public.parcels
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('producer', 'cooperative_manager')
    )
  );

-- Capteurs: seulement les producteurs gèrent leurs capteurs
CREATE POLICY "sensors_select_owner" ON public.sensor_devices
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'cooperative_manager')
    )
  );

-- Marketplace: visibilité publique, gestion par owner
CREATE POLICY "marketplace_listings_select_public" ON public.marketplace_listings
  FOR SELECT USING (
    status = 'available' 
    OR seller_id = auth.uid()
  );

CREATE POLICY "marketplace_listings_insert_producer" ON public.marketplace_listings
  FOR INSERT WITH CHECK (
    seller_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('producer', 'cooperative_manager')
    )
  );

-- Commandes: acheteur ET vendeur voient
CREATE POLICY "orders_select_participants" ON public.orders
  FOR SELECT USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );

CREATE POLICY "orders_insert_buyers" ON public.orders
  FOR INSERT WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('wholesaler', 'retailer', 'producer', 'cooperative_manager')
    )
  );

-- Finances: propriétaire uniquement
CREATE POLICY "user_finances_select_owner" ON public.user_finances
  FOR SELECT USING (user_id = auth.uid());

-- Diagnostic: propriétaire uniquement
CREATE POLICY "disease_analyses_select_owner" ON public.disease_analyses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "disease_analyses_insert_producer" ON public.disease_analyses
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'producer'
    )
  );
```

---

## 4. Logique d'Affichage par Rôle

### 4.1 Navigation adaptative

```typescript
// src/lib/roles.ts
export type AppRole = 'producer' | 'wholesaler' | 'retailer' | 'admin' | 'cooperative_manager'

export interface NavItem {
  to: string
  label: string
  icon: string
  roles: AppRole[]
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Accueil', icon: 'Home', roles: ['producer', 'wholesaler', 'retailer', 'admin', 'cooperative_manager'] },
  { to: '/parcels', label: 'Parcelles', icon: 'Sprout', roles: ['producer', 'admin', 'cooperative_manager'] },
  { to: '/sensors', label: 'Capteurs', icon: 'Droplets', roles: ['producer', 'admin', 'cooperative_manager'] },
  { to: '/diagnose', label: 'Diagnostic', icon: 'Microscope', roles: ['producer', 'admin'] },
  { to: '/marketplace', label: 'Marketplace', icon: 'ShoppingCart', roles: ['producer', 'wholesaler', 'retailer', 'admin', 'cooperative_manager'] },
  { to: '/finances', label: 'Finances', icon: 'Wallet', roles: ['producer', 'wholesaler', 'retailer', 'admin'] },
  { to: '/finances/credit', label: 'Crédit', icon: 'CreditCard', roles: ['producer', 'wholesaler', 'retailer', 'admin'] },
  { to: '/admin', label: 'Admin', icon: 'Settings', roles: ['admin'] },
]

export function getNavForRole(role: AppRole): NavItem[] {
  return NAV_ITEMS.filter(item => item.roles.includes(role))
}

export function canAccessPage(page: string, role: AppRole): boolean {
  const item = NAV_ITEMS.find(n => n.to === page)
  return item ? item.roles.includes(role) : false
}
```

### 4.2 Redirection automatique

```typescript
// Rediriger vers la page appropriée selon le rôle
export function getDefaultRoute(role: AppRole): string {
  switch (role) {
    case 'producer': return '/dashboard'
    case 'wholesaler': return '/dashboard'  // Dashboard acheteur
    case 'retailer': return '/dashboard'    // Dashboard acheteur simplifié
    case 'admin': return '/admin'
    case 'cooperative_manager': return '/dashboard'
    default: return '/dashboard'
  }
}
```

### 4.3 Variants d'UI par rôle

**Dashboard:**
- `producer`: Stats parcelles + alertes météo + finances + diagnostic récent
- `wholesaler`: Stats commandes en cours + dépenses + offres suivies
- `retailer`: Stats commandes récentes + dépenses + favoris
- `admin`: Stats globales + utilisateurs + alertes modération
- `cooperative_manager`: Stats coopérative + membres + production

**Marketplace:**
- `producer`: Onglet "Mes offres" + "Publier" + "Commandes reçues" + "Messagerie"
- `wholesaler`: Onglet "Marché" + "Mes commandes" + "Messagerie" + filtres volume
- `retailer`: Onglet "Marché" + "Mes commandes" + "Messagerie" (sans filtres volume)
- `admin`: Onglet "Modération" + "Tous les offres" + "Utilisateurs"
- `cooperative_manager`: Onglet "Offres coopérative" + "Commandes" + "Membres"

**Finances:**
- `producer`: Dépenses (semences, engrais...) + Ventes (récoltes) + preuves + export
- `wholesaler`: Dépenses (achats) + budget + preuves
- `retailer`: Dépenses (achats) simplifié
- `admin`: Vue agrégée globale

---

## 5. Flux d'Onboarding par Rôle

### 5.1 Producteur

```
Inscription → Choix rôle "Je suis producteur"
→ Nom + Téléphone + Région
→ Ajouter première parcelle (nom, superficie, culture, date semis)
→ Dashboard producteur
```

### 5.2 Grossiste

```
Inscription → Choix rôle "Je suis acheteur grossiste"
→ Nom entreprise + Téléphone + Région + Type de produits achetés
→ Dashboard acheteur
→ Parcourir marketplace
```

### 5.3 Détaillant

```
Inscription → Choix rôle "Je suis acheteur détaillant"
→ Nom + Téléphone + Ville
→ Dashboard acheteur simplifié
→ Parcourir marketplace
```

---

## 6. Sécurité & Permissions

### 6.1 Principe RLS

Chaque table a des policies qui vérifient:
1. `auth.uid()` correspond au propriétaire
2. Le rôle dans `profiles` permet l'action

### 6.2 Vérification de rôle côté client

```typescript
// Hook pour vérifier le rôle
export function useUserRole(): AppRole | null {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()
      if (error) throw error
      return data
    }
  })
  return profile?.role ?? null
}
```

### 6.3 Guard de route

```typescript
// Composant de guard pour protéger les pages
export function RoleGuard({ allowedRoles, children }: { allowedRoles: AppRole[], children: React.ReactNode }) {
  const role = useUserRole()
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRoute(role || 'producer')} />
  }
  return <>{children}</>
}
```

---

## 7. Marketplace — Spécificités par Rôle

### 7.1 Producteur (Vendeur)

**Actions:**
- Publier une offre (titre, description, catégorie, prix, quantité, unité, région, photos)
- Modifier/supprimer ses offres
- Voir les commandes reçues
- Accepter/refuser/négocier une commande
- Messagerie avec acheteurs
- Voir statistiques de ventes

**Onglets marketplace:**
1. Marché (vue globale)
2. Mes offres (CRUD)
3. Commandes reçues
4. Messagerie

### 7.2 Grossiste (Acheteur)

**Actions:**
- Parcourir le marché (filtres: catégorie, région, volume min, prix)
- Contacter un producteur (messagerie)
- Passer une commande (quantité bulk, prix négocié)
- Suivre ses commandes
- Voir historique d'achats
- Noter les producteurs

**Onglets marketplace:**
1. Marché (avec filtres volume)
2. Mes commandes
3. Messagerie
4. Favoris

**Filtres spécifiques grossiste:**
- Volume minimum disponible
- Prix dégressif selon quantité
- Région (pour logistique)
- Certifications (bio, équitable)
- Délai de livraison

### 7.3 Détaillist (Acheteur)

**Actions:**
- Parcourir le marché (filtres simples: catégorie, proximité, prix)
- Contacter un producteur
- Passer une commande (petite quantité)
- Suivre ses commandes
- Voir historique d'achats

**Onglets marketplace:**
1. Marché (simplifié)
2. Mes commandes
3. Messagerie

**Filtres spécifiques détaillant:**
- Proximité (ville/quartier)
- Prix unitaire
- Fraîcheur (date de récolte)
- Pas de filtre volume minimum

### 7.4 Admin (Modérateur)

**Actions:**
- Voir toutes les offres
- Suspendre/supprimer une offre
- Voir tous les utilisateurs
- Suspendre un utilisateur
- Résoudre un litige
- Statistiques globales

**Onglets marketplace:**
1. Toutes les offres (modération)
2. Utilisateurs
3. Litiges
4. Statistiques

---

## 8. Finances — Spécificités par Rôle

### 8.1 Producteur

**Types de transactions:**
- `expense`: Semences, engrais, pesticides, main d'œuvre, transport, outillage, eau/irrigation
- `sale`: Vente de récoltes (quantité kg, prix unitaire, acheteur)
- `transfer`: Transferts entre comptes

**Preuves acceptées:**
- Reçu (photo)
- SMS Mobile Money (Orange Money, Moov Money)
- Témoin (nom + téléphone)
- Facture

**Credit scoring:**
- Basé sur: volume de ventes, régularité, ratio d'endettement, preuves, ancienneté

### 8.2 Grossiste

**Types de transactions:**
- `expense`: Achats de produits agricoles (quantité, prix, producteur)
- `transfer`: Transferts

**Preuves acceptées:**
- Reçu (photo)
- SMS Mobile Money
- Bon de commande

**Credit scoring:**
- Basé sur: volume d'achats, régularité des paiements, ratio trésorerie

### 8.3 Détaillant

**Types de transactions:**
- `expense`: Achats pour consommation/revente
- `transfer`: Transferts

**Preuves acceptées:**
- Reçu (photo)
- SMS Mobile Money

**Credit scoring:**
- Basé sur: historique d'achats, régularité

---

## 9. Plan d'Implémentation

### Phase 1: Base de données (Semaine 1)
- [ ] Étendre enum `app_role`
- [ ] Ajouter colonnes à `profiles`
- [ ] Créer migration RLS par rôle
- [ ] Créer trigger `on_auth_user_created` (rôle par défaut = 'producer')

### Phase 2: Logique client (Semaine 1)
- [ ] Créer `src/lib/roles.ts` (types, NAV_ITEMS, guards)
- [ ] Créer `useUserRole()` hook
- [ ] Créer `RoleGuard` component
- [ ] Adapter la navigation selon le rôle

### Phase 3: Onboarding (Semaine 2)
- [ ] Page d'inscription avec choix de rôle
- [ ] Formulaire adapté par rôle
- [ ] Redirection automatique après inscription

### Phase 4: Pages adaptatives (Semaine 2-3)
- [ ] Dashboard variant par rôle
- [ ] Marketplace onglets par rôle
- [ ] Finances simplifié pour détaillant
- [ ] Page admin (modération)

### Phase 5: Tests & validation (Semaine 3)
- [ ] Tests RLS avec 3 utilisateurs (1 par rôle)
- [ ] Tests navigation et accès pages
- [ ] Tests marketplace (publier, commander, messagerie)
- [ ] Déploiement production

---

## 10. Métriques de Succès par Rôle

| Métrique | Producteur | Grossiste | Détaillant |
|----------|-----------|----------|------------|
| Parcelles moyennes | 3+ | N/A | N/A |
| Offres publiques/mois | 5+ | N/A | N/A |
| Commandes/mois | 2+ reçues | 10+ passées | 5+ passées |
| Transactions financières/mois | 20+ | 15+ | 10+ |
| Diagnostics IA/mois | 5+ | N/A | N/A |
| Taux rétention J+30 | 65% | 60% | 55% |

---

**Document de référence pour tout développement futur sur AgroField2.**  
**Toute modification de rôles ou permissions doit mettre à jour ce document.**