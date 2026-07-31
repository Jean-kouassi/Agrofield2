/**
 * AgroField Marketplace - Supabase Integration
 * Fonctions pour interagir avec la base de données
 */

import { supabase } from '@/integrations/supabase/client';
import type { Offer, Order, OfferFilters, OffersResponse, Cart } from '../types/marketplace';

/**
 * Récupérer toutes les offres avec filtres
 */
export async function fetchOffers(filters?: OfferFilters): Promise<OffersResponse> {
  let query = supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact' })
    .eq('status', 'available');

  // Appliquer les filtres
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.region) {
    query = query.eq('region', filters.region);
  }

  if (filters?.minPrice) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters?.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Tri
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    offers: data as Offer[],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * Récupérer une offre par ID
 */
export async function getOffer(id: string): Promise<Offer | null> {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Offer;
}

/**
 * Créer une nouvelle offre
 */
export async function createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'contacts'>): Promise<Offer> {
  const newOffer = {
    ...offer,
    views: 0,
    contacts: 0,
  };

  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert([newOffer])
    .select()
    .single();

  if (error) throw error;
  return data as Offer;
}

/**
 * Mettre à jour une offre
 */
export async function updateOffer(id: string, updates: Partial<Offer>): Promise<Offer> {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Offer;
}

/**
 * Supprimer une offre
 */
export async function deleteOffer(id: string): Promise<void> {
  const { error } = await supabase
    .from('marketplace_listings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Créer une commande
 */
export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single();

  if (error) throw error;

  // Mettre à jour le statut de l'offre
  await updateOffer(order.offerId, { status: 'reserved' });

  return data as Order;
}

/**
 * Récupérer les commandes d'un utilisateur
 */
export async function getUserOrders(userId: string, role: 'buyer' | 'seller'): Promise<Order[]> {
  const field = role === 'buyer' ? 'buyerId' : 'sellerId';
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq(field, userId)
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return data as Order[];
}

/**
 * Mettre à jour le statut d'une commande
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const updates: Partial<Order> = { status };

  if (status === 'confirmed') {
    updates.confirmedAt = new Date().toISOString();
  } else if (status === 'completed') {
    updates.completedAt = new Date().toISOString();
    // Mettre à jour l'offre comme vendue
    const order = await getOrder(orderId);
    await updateOffer(order.offerId, { status: 'sold' });
  } else if (status === 'cancelled') {
    updates.cancelledAt = new Date().toISOString();
    // Libérer l'offre
    const order = await getOrder(orderId);
    await updateOffer(order.offerId, { status: 'available' });
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

/**
 * Récupérer une commande par ID
 */
async function getOrder(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data as Order;
}

/**
 * Obtenir les statistiques marketplace
 */
export async function getMarketplaceStats(): Promise<OfferStats> {
  const { count: totalOffers } = await supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact', head: true });

  const { count: activeOffers } = await supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available');

  const { data: priceData } = await supabase
    .from('marketplace_listings')
    .select('price')
    .eq('status', 'available');

  const avgPrice = priceData && priceData.length > 0
    ? priceData.reduce((sum, o) => sum + o.price, 0) / priceData.length
    : 0;

  const { data: categoryData } = await supabase
    .from('marketplace_listings')
    .select('category')
    .eq('status', 'available');

  const categoryCount: Record<string, number> = {};
  categoryData?.forEach(offer => {
    categoryCount[offer.category] = (categoryCount[offer.category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const { count: recentSales } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completedAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return {
    totalOffers: totalOffers || 0,
    activeOffers: activeOffers || 0,
    avgPrice,
    topCategories,
    recentSales: recentSales || 0,
  };
}

/**
 * Offline Queue - Stocker les actions hors ligne
 */
export interface OfflineAction {
  id: string;
  type: 'create_offer' | 'update_offer' | 'create_order' | 'update_order';
  payload: any;
  createdAt: string;
  synced: boolean;
}

export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'createdAt' | 'synced'>): Promise<void> {
  // Utiliser localStorage pour stocker les actions offline
  const actions: OfflineAction[] = JSON.parse(localStorage.getItem('marketplace_offline_queue') || '[]');
  
  actions.push({
    ...action,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    synced: false,
  });

  localStorage.setItem('marketplace_offline_queue', JSON.stringify(actions));
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  return JSON.parse(localStorage.getItem('marketplace_offline_queue') || '[]');
}

export async function clearOfflineQueue(): Promise<void> {
  localStorage.removeItem('marketplace_offline_queue');
}

/**
 * Sync offline queue avec le serveur
 */
export async function syncOfflineQueue(): Promise<{ success: number; failed: number }> {
  const queue = await getOfflineQueue();
  let success = 0;
  let failed = 0;

  for (const action of queue) {
    if (action.synced) continue;

    try {
      switch (action.type) {
        case 'create_offer':
          await createOffer(action.payload);
          break;
        case 'update_offer':
          await updateOffer(action.payload.id, action.payload.updates);
          break;
        case 'create_order':
          await createOrder(action.payload);
          break;
        case 'update_order':
          await updateOrderStatus(action.payload.id, action.payload.status);
          break;
      }
      success++;
    } catch (error) {
      console.error('Failed to sync offline action:', error);
      failed++;
    }
  }

  // Retirer les actions syncées
  const remaining = queue.filter(a => !a.synced);
  localStorage.setItem('marketplace_offline_queue', JSON.stringify(remaining));

  return { success, failed };
}
