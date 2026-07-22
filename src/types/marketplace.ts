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

export type PaymentMethod = 'cash' | 'orange_money' | 'moov_money' | 'virement';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

export interface Offer {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  payment_methods: PaymentMethod[];
  location?: string;
  region?: string;
  images?: string[];
  status: 'active' | 'sold' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  offer_id: string;
  buyer_id: string;
  seller_id: string;
  quantity: number;
  total_price: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceStats {
  totalOffers: number;
  activeOffers: number;
  totalOrders: number;
  totalVolume: number;
  averagePrice: number;
}
