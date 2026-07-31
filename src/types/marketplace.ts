/**
 * AgroField Marketplace Types
 * Types pour la gestion des offres et commandes
 */

// Catégories de produits agricoles
export type ProductCategory = 
  | 'tomates'
  | 'oignons'
  | 'mil'
  | 'sorgho'
  | 'mais'
  | 'niebe'
  | 'arachide'
  | 'coton'
  | 'mangue'
  | 'autre';

export type UnitType = 'kg' | 'sac' | 'panier' | 'caisse' | 'unite';

export type OfferStatus = 'available' | 'reserved' | 'sold' | 'expired';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'orange_money' | 'moov_money' | 'virement';

// Interface pour une offre de produit
export interface Offer {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: ProductCategory;
  quantity: number;
  unit: UnitType;
  price: number; // Prix par unité en FCFA
  location: string; // Ville/Village
  region: string; // Région
  images: string[]; // URLs des photos
  availableFrom: string; // Date ISO
  expiresAt: string; // Date ISO
  status: OfferStatus;
  views: number;
  contacts: number;
  createdAt: string;
  updatedAt: string;
  
  // Champs calculés (optionnels)
  totalPrice?: number; // quantity * price
  distance?: number; // Distance en km (si géolocalisation)
}

// Interface pour une commande
export interface Order {
  id: string;
  offerId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

// Filtres de recherche d'offres
export interface OfferFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  location?: string;
  region?: string;
  status?: OfferStatus;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Réponses API
export interface OffersResponse {
  offers: Offer[];
  total: number;
  hasMore: boolean;
}

export interface OfferStats {
  totalOffers: number;
  activeOffers: number;
  avgPrice: number;
  topCategories: { category: string; count: number }[];
  recentSales: number;
}

// Panier
export interface CartItem {
  offerId: string;
  offer: Offer;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: string;
}
