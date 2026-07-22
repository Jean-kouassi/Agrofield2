/**
 * AgroField Marketplace - Supabase Integration
 * Fonctions pour interagir avec la base de données
 */

import { supabase } from '@/integrations/supabase/client';
import type { Offer, Order, OfferFilters, OffersResponse } from '../types/marketplace';

/**
 * Récupérer toutes les offres avec filtres
 */
export async function fetchOffers(filters?: OfferFilters): Promise<OffersResponse> {
  let query = supabase
    .from('offers')
    .select('*', { count: 'exact' })
    .eq('status', 'active');

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
    .from('offers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Offer;
}

/**
 * Créer une nouvelle offre
 */
export async function createOffer(offer: Omit<Offer, 'id' | 'created_at' | 'updated_at'>): Promise<Offer> {
  const newOffer = {
    ...offer,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('offers')
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
    .from('offers')
    .update({ ...updates, updated_at: new Date().toISOString() })
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
    .from('offers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Créer une commande
 */
export async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      ...order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  // Mettre à jour le statut de l'offre
  await updateOffer(order.offer_id, { status: 'sold' });

  return data as Order;
}

/**
 * Récupérer les commandes d'un utilisateur
 */
export async function getUserOrders(userId: string, role: 'buyer' | 'seller'): Promise<Order[]> {
  const field = role === 'buyer' ? 'buyer_id' : 'seller_id';
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq(field, userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
}

/**
 * Obtenir statistiques marketplace
 */
export async function getMarketplaceStats(): Promise<{
  totalOffers: number;
  activeOffers: number;
  totalOrders: number;
  totalVolume: number;
}> {
  const { data: stats } = await supabase
    .from('marketplace_stats')
    .select('*')
    .single();

  return {
    totalOffers: stats?.total_offers || 0,
    activeOffers: stats?.active_offers || 0,
    totalOrders: stats?.total_orders || 0,
    totalVolume: stats?.total_volume_xof || 0,
  };
}
