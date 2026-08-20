import {
  Wheat,
  Carrot,
  Apple,
  Sprout,
  Leaf,
  Droplets,
  Package,
  LucideIcon,
} from 'lucide-react'

export interface MarketplaceCategory {
  id: string
  label: string
  icon: LucideIcon
  color: string
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { id: 'cereales', label: 'Céréales', icon: Wheat, color: '#d97706' },
  { id: 'legumes', label: 'Légumes', icon: Carrot, color: '#166534' },
  { id: 'fruits', label: 'Fruits', icon: Apple, color: '#dc2626' },
  { id: 'legumineuses', label: 'Légumineuses', icon: Sprout, color: '#65a30d' },
]

// Alias pour compatibilité avec les composants existants
export const CATEGORIES = MARKETPLACE_CATEGORIES;

export { CategoryBadge } from '@/components/marketplace/category-badge'

export type SaleType = 'gros' | 'detail'
export type ListingStatus = 'available' | 'reserved' | 'sold' | 'draft'

export interface MarketplaceListing {
  id: string
  title: string
  category: string
  price: number
  unit: string
  qty: number
  minOrder: number
  region: string
  city: string
  seller: string
  rating: number
  status: ListingStatus
  saleType: SaleType
  desc: string
  days: number
  images?: string[]  // URLs des images du bucket marketplace-images
}

export const REGIONS = [
  'Centre',
  'Hauts-Bassins',
  'Boucle du Mouhoun',
  'Est',
  'Centre-Ouest',
  'Sud-Ouest',
  'Cascades',
  'Plateau-Central',
]

export const UNITS = [
  'kg',
  'sac 50kg',
  'sac 100kg',
  'carton',
  'tonne',
  'pièce',
]

export function catOf(id: string) {
  return MARKETPLACE_CATEGORIES.find((c) => c.id === id)
}

export function productImage(seed: string, i: number) {
  return `https://picsum.photos/seed/AgroSphere-${seed}-${i}/640/480`
}

export function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const RAW_LISTINGS: MarketplaceListing[] = [
  {
    id: 'l1',
    title: 'Tomates fraîches',
    category: 'legumes',
    price: 250,
    unit: 'kg',
    qty: 480,
    minOrder: 10,
    region: 'Boucle du Mouhoun',
    city: 'Dédougou',
    seller: 'Coopérative Faso Tomate',
    rating: 4.6,
    status: 'available',
    saleType: 'gros',
    desc: 'Tomates rondes récoltées cette semaine, calibre moyen à gros, idéales pour transformation ou vente au détail.',
    days: 1,
  },
  {
    id: 'l2',
    title: 'Oignons rouges',
    category: 'legumes',
    price: 300,
    unit: 'kg',
    qty: 620,
    minOrder: 20,
    region: 'Boucle du Mouhoun',
    city: 'Tougan',
    seller: 'Amidou Sawadogo',
    rating: 4.3,
    status: 'available',
    saleType: 'gros',
    desc: 'Oignons rouges du Sourou, bien secs, bonne conservation, disponibles en sacs de 50 kg.',
    days: 3,
  },
  {
    id: 'l3',
    title: 'Piment frais',
    category: 'legumes',
    price: 700,
    unit: 'kg',
    qty: 90,
    minOrder: 5,
    region: 'Centre',
    city: 'Ouagadougou',
    seller: 'Mariam Ouédraogo',
    rating: 4.8,
    status: 'reserved',
    saleType: 'detail',
    desc: 'Piment frais très parfumé, cueilli à maturité, parfait pour les marchés urbains.',
    days: 2,
  },
  {
    id: 'l4',
    title: 'Mil (petit mil)',
    category: 'cereales',
    price: 350,
    unit: 'sac 100kg',
    qty: 140,
    minOrder: 1,
    region: 'Est',
    city: "Fada N'Gourma",
    seller: 'Coopérative Wend-Panga',
    rating: 4.5,
    status: 'available',
    saleType: 'gros',
    desc: 'Mil de la dernière campagne, bien vanné, stocké dans un magasin sec.',
    days: 5,
  },
  {
    id: 'l5',
    title: 'Sorgho blanc',
    category: 'cereales',
    price: 320,
    unit: 'kg',
    qty: 950,
    minOrder: 25,
    region: 'Centre',
    city: 'Ouagadougou',
    seller: 'SCOOP Bendré',
    rating: 4.2,
    status: 'available',
    saleType: 'gros',
    desc: 'Sorgho blanc de qualité meunière, faible taux d\'impuretés.',
    days: 4,
  },
  {
    id: 'l6',
    title: 'Maïs jaune',
    category: 'cereales',
    price: 280,
    unit: 'kg',
    qty: 1100,
    minOrder: 25,
    region: 'Hauts-Bassins',
    city: 'Bobo-Dioulasso',
    seller: 'Ferme Kiswendsida',
    rating: 4.4,
    status: 'available',
    saleType: 'gros',
    desc: 'Maïs jaune séché, taux d\'humidité contrôlé, prêt pour l\'aliment bétail ou la mouture.',
    days: 1,
  },
  {
    id: 'l7',
    title: 'Riz local étuvé',
    category: 'cereales',
    price: 400,
    unit: 'kg',
    qty: 60,
    minOrder: 10,
    region: 'Boucle du Mouhoun',
    city: 'Bagré',
    seller: 'Coopérative Femmes de Bagré',
    rating: 4.9,
    status: 'sold',
    saleType: 'detail',
    desc: 'Riz étuvé artisanalement, grain long, très apprécié sur les marchés de Ouagadougou.',
    days: 7,
  },
  {
    id: 'l8',
    title: 'Niébé (haricot local)',
    category: 'legumineuses',
    price: 450,
    unit: 'kg',
    qty: 300,
    minOrder: 15,
    region: 'Centre-Ouest',
    city: 'Koudougou',
    seller: 'Issa Kaboré',
    rating: 4.1,
    status: 'available',
    saleType: 'gros',
    desc: 'Niébé blanc bien trié, faible taux de grains cassés.',
    days: 6,
  },
  {
    id: 'l9',
    title: 'Arachide décortiquée',
    category: 'legumineuses',
    price: 600,
    unit: 'kg',
    qty: 210,
    minOrder: 10,
    region: 'Sud-Ouest',
    city: 'Gaoua',
    seller: 'Coopérative Sud-Ouest Agro',
    rating: 4.6,
    status: 'available',
    saleType: 'gros',
    desc: 'Arachide fraîchement décortiquée, calibre régulier, sans corps étrangers.',
    days: 2,
  },
  {
    id: 'l10',
    title: 'Mangues Kent',
    category: 'fruits',
    price: 500,
    unit: 'carton',
    qty: 75,
    minOrder: 2,
    region: 'Hauts-Bassins',
    city: 'Orodara',
    seller: 'Verger Bèrèkuy',
    rating: 4.7,
    status: 'reserved',
    saleType: 'gros',
    desc: 'Mangues Kent export, cartons de 4 kg, maturité contrôlée pour le transport.',
    days: 1,
  },
  {
    id: 'l11',
    title: 'Pastèques',
    category: 'fruits',
    price: 150,
    unit: 'pièce',
    qty: 400,
    minOrder: 20,
    region: 'Centre',
    city: 'Loumbila',
    seller: 'Ferme Loumbila Verte',
    rating: 4.0,
    status: 'available',
    saleType: 'detail',
    desc: 'Pastèques sucrées cultivées sous irrigation goutte-à-goutte, calibre 4-6 kg.',
    days: 3,
  },
  {
    id: 'l12',
    title: 'Sésame blanc',
    category: 'legumineuses',
    price: 900,
    unit: 'kg',
    qty: 130,
    minOrder: 5,
    region: 'Cascades',
    city: 'Banfora',
    seller: 'Coopérative Cascades Export',
    rating: 4.8,
    status: 'available',
    saleType: 'gros',
    desc: 'Sésame blanc calibré, taux d\'huile élevé, destiné à l\'exportation.',
    days: 4,
  },
]

export interface TickerItem {
  name: string
  price: number
  unit: string
  trend: 'up' | 'down'
}

export const TICKER: TickerItem[] = RAW_LISTINGS.slice(0, 8).map((l, i) => ({
  name: l.title,
  price: l.price,
  unit: l.unit,
  trend: i % 3 === 0 ? 'down' : 'up',
}))

export const MY_LISTING_IDS = ['l1', 'l4', 'l9', 'l11']

export type OrderStatus = 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export interface MarketplaceOrder {
  id: string
  title: string
  seller: string
  qty: number
  unit: string
  total: number
  status: OrderStatus
  date: string
}

export const ORDER_LABEL: Record<OrderStatus, string> = {
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

export const ORDER_STEPS: OrderStatus[] = ['confirmed', 'preparing', 'shipped', 'delivered']

export const MOCK_ORDERS: MarketplaceOrder[] = [
  {
    id: 'c1',
    title: 'Tomates fraîches',
    seller: 'Coopérative Faso Tomate',
    qty: 50,
    unit: 'kg',
    total: 12500,
    status: 'shipped',
    date: '05 août 2026',
  },
  {
    id: 'c2',
    title: 'Mangues Kent',
    seller: 'Verger Bèrèkuy',
    qty: 6,
    unit: 'carton',
    total: 3000,
    status: 'confirmed',
    date: '06 août 2026',
  },
  {
    id: 'c3',
    title: 'Mil (petit mil)',
    seller: 'Coopérative Wend-Panga',
    qty: 2,
    unit: 'sac 100kg',
    total: 700,
    status: 'delivered',
    date: '28 juillet 2026',
  },
  {
    id: 'c4',
    title: 'Sésame blanc',
    seller: 'Coopérative Cascades Export',
    qty: 15,
    unit: 'kg',
    total: 13500,
    status: 'cancelled',
    date: '20 juillet 2026',
  },
]

export interface ChatMessage {
  from: 'me' | 'them'
  text: string
  time: string
}

export interface MarketplaceConversation {
  id: string
  name: string
  last: string
  time: string
  unread: number
  online: boolean
  messages: ChatMessage[]
}

export const MOCK_CONVERSATIONS: MarketplaceConversation[] = [
  {
    id: 'm1',
    name: 'Coopérative Faso Tomate',
    last: 'D\'accord, on prépare 50 kg pour demain matin.',
    time: '10:42',
    unread: 2,
    online: true,
    messages: [
      { from: 'them', text: 'Bonjour, votre commande de tomates est bien reçue.', time: '10:12' },
      { from: 'me', text: 'Merci, est-ce possible d\'avoir 50 kg demain ?', time: '10:20' },
      { from: 'them', text: 'D\'accord, on prépare 50 kg pour demain matin.', time: '10:42' },
    ],
  },
  {
    id: 'm2',
    name: 'Verger Bèrèkuy',
    last: 'Les mangues sont réservées à votre nom.',
    time: 'Hier',
    unread: 0,
    online: false,
    messages: [
      { from: 'them', text: 'Les mangues sont réservées à votre nom.', time: 'Hier, 18:03' },
      { from: 'me', text: 'Parfait, merci beaucoup !', time: 'Hier, 18:10' },
    ],
  },
  {
    id: 'm3',
    name: 'Issa Kaboré',
    last: 'Vous êtes intéressé par le niébé ?',
    time: 'Lun.',
    unread: 1,
    online: true,
    messages: [{ from: 'them', text: 'Vous êtes intéressé par le niébé ?', time: 'Lun. 09:15' }],
  },
]

export interface SalesPoint {
  day: string
  ventes: number
}

export const SALES_7D: SalesPoint[] = [
  { day: 'Lun', ventes: 42000 },
  { day: 'Mar', ventes: 58000 },
  { day: 'Mer', ventes: 31000 },
  { day: 'Jeu', ventes: 67000 },
  { day: 'Ven', ventes: 74000 },
  { day: 'Sam', ventes: 95000 },
  { day: 'Dim', ventes: 51000 },
]

export interface FilterValues {
  priceMin: string
  priceMax: string
  region: string
  availability: string
  saleType: string
}

/**
 * Map Supabase marketplace_listings row to frontend MarketplaceListing
 */
export function mapSupabaseListing(row: any): MarketplaceListing {
  console.log('[mapSupabaseListing] Raw row images:', row.images);
  const result = {
    id: row.id,
    title: row.title,
    category: row.category,
    price: row.price,
    unit: row.unit,
    qty: row.quantity,
    minOrder: row.min_order,
    region: row.region,
    city: row.location,
    seller: row.seller_name || 'Vendeur',
    rating: 5.0,
    status: row.status,
    saleType: 'gros', // Default, can be added to schema later
    desc: row.description,
    days: row.created_at ? Math.floor((Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    // Include images array from database
    images: row.images || [],
  } as MarketplaceListing;
  console.log('[mapSupabaseListing] Mapped images:', result.images);
  return result;
}

/**
 * Map Supabase order row to frontend MarketplaceOrder
 */
export function mapSupabaseOrder(row: any): MarketplaceOrder {
  return {
    id: row.id,
    title: 'Commande #' + row.id.slice(0, 8),
    seller: 'Vendeur', // Would need to join with profiles or listings
    qty: row.quantity,
    unit: 'kg', // Would need to get from listing
    total: row.total_price,
    status: row.status as OrderStatus,
    date: new Date(row.created_at).toLocaleDateString('fr-FR'),
  }
}
