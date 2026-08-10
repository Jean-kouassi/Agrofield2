/**
 * Marketplace Service — Supabase integration
 * 
 * Fonctions pour gérer les offres (vendeur) et commandes (acheteur/vendeur).
 * Toutes les fonctions utilisent le client Supabase authentifié.
 */

import { supabase } from '@/integrations/supabase/client'
import {
  type MarketplaceListing,
  type MarketplaceOrder,
  type OrderStatus,
  type ListingStatus,
  type SaleType,
  mapSupabaseListing,
  mapSupabaseOrder,
} from '@/lib/marketplace-data'

// ============================================================
// TYPES
// ============================================================

export interface CreateListingInput {
  title: string
  category: string
  description: string
  price: number
  quantity: number
  unit: string
  location: string
  region: string
  expires_at: string
  images?: string[]
  // Champs ignorés (non présents dans la DB actuelle)
  min_order?: number
  status?: string
  saleType?: string
}

export interface CreateOrderInput {
  offer_id: string
  seller_id: string
  quantity: number
  total_price: number
  payment_method: 'cash' | 'orange_money' | 'moov_money' | 'virement'
  notes?: string | null
}

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: 'buyer' | 'seller' | 'both'
}

// ============================================================
// AUTH / USER
// ============================================================

/**
 * Récupère l'utilisateur courant depuis Supabase Auth
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Cast en any car la colonne 'role' n'existe pas encore dans types.ts
  // (migration pas encore appliquée sur Supabase)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .maybeSingle() as { data: any | null, error: any }

  return {
    id: user.id,
    email: user.email ?? null,
    full_name: profile?.full_name ?? null,
    role: (profile?.role as 'buyer' | 'seller' | 'both') ?? 'both',
  }
}

// ============================================================
// LISTINGS (OFFRES) — Côté Vendeur
// ============================================================

/**
 * Récupère toutes les offres disponibles (marketplace public)
 */
export async function fetchListings(): Promise<MarketplaceListing[]> {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchListings: ${error.message}`)
  return (data ?? []).map(mapSupabaseListing)
}

/**
 * Récupère les offres du vendeur connecté
 */
export async function fetchMyListings(): Promise<MarketplaceListing[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchMyListings: ${error.message}`)
  return (data ?? []).map(mapSupabaseListing)
}

/**
 * Crée une nouvelle offre (vendeur)
 */
export async function createListing(input: CreateListingInput): Promise<MarketplaceListing> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  // Récupérer le nom du vendeur depuis profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const sellerName = profile?.full_name || user.email?.split('@')[0] || 'Vendeur'

  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      seller_id: user.id,
      seller_name: sellerName,
      title: input.title,
      description: input.description,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit,
      price: input.price,
      location: input.location,
      region: input.region,
      images: input.images ?? [],
      expires_at: input.expires_at,
      status: 'available',
    })
    .select()
    .single()

  if (error) throw new Error(`createListing: ${error.message}`)
  return mapSupabaseListing(data)
}

/**
 * Met à jour le statut d'une offre
 */
export async function updateListingStatus(
  id: string,
  status: ListingStatus
): Promise<void> {
  const { error } = await supabase
    .from('marketplace_listings')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(`updateListingStatus: ${error.message}`)
}

/**
 * Supprime une offre
 */
export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase
    .from('marketplace_listings')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteListing: ${error.message}`)
}

/**
 * Incrémente le compteur de vues
 */
export async function incrementViews(id: string): Promise<void> {
  // Récupérer les vues actuelles puis incrémenter
  const { data } = await supabase
    .from('marketplace_listings')
    .select('views')
    .eq('id', id)
    .single()
  
  if (data) {
    await supabase
      .from('marketplace_listings')
      .update({ views: (data.views ?? 0) + 1 })
      .eq('id', id)
    }
}

// ============================================================
// ORDERS (COMMANDES) — Côté Acheteur
// ============================================================

/**
 * Récupère les commandes où je suis acheteur
 */
export async function fetchMyBuyOrders(): Promise<MarketplaceOrder[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      listing:offer_id (
        id, title, unit, seller_name
      )
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchMyBuyOrders: ${error.message}`)

  return (data ?? []).map((row: any) => {
    const listing = row.listing
    return {
      id: row.id,
      title: listing?.title ?? 'Produit',
      seller: listing?.seller_name ?? 'Vendeur',
      qty: row.quantity,
      unit: listing?.unit ?? 'kg',
      total: row.total_price,
      status: mapOrderStatus(row.status),
      date: new Date(row.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    } as MarketplaceOrder
  })
}

/**
 * Récupère les commandes où je suis vendeur
 */
export async function fetchMySellOrders(): Promise<MarketplaceOrder[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      listing:offer_id (
        id, title, unit, seller_name
      )
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchMySellOrders: ${error.message}`)

  return (data ?? []).map((row: any) => {
    const listing = row.listing
    return {
      id: row.id,
      title: listing?.title ?? 'Produit',
      seller: listing?.seller_name ?? 'Vendeur',
      qty: row.quantity,
      unit: listing?.unit ?? 'kg',
      total: row.total_price,
      status: mapOrderStatus(row.status),
      date: new Date(row.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    } as MarketplaceOrder
  })
}

/**
 * Alias pour fetchMyBuyOrders (utilisé par OrdersView)
 */
export const fetchMyOrders = fetchMyBuyOrders

/**
 * Crée une commande (acheteur)
 */
export async function createOrder(input: CreateOrderInput): Promise<MarketplaceOrder> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      seller_id: input.seller_id,
      offer_id: input.offer_id,
      quantity: input.quantity,
      total_price: input.total_price,
      payment_method: input.payment_method,
      status: 'pending',
      notes: input.notes ?? null,
    })
    .select(`
      *,
      listing:offer_id (
        id, title, unit, seller_name
      )
    `)
    .single()

  if (error) throw new Error(`createOrder: ${error.message}`)

  const listing = (data as any)?.listing
  return {
    id: data.id,
    title: listing?.title ?? 'Produit',
    seller: listing?.seller_name ?? 'Vendeur',
    qty: data.quantity,
    unit: listing?.unit ?? 'kg',
    total: data.total_price,
    status: mapOrderStatus(data.status),
    date: new Date(data.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }
}

/**
 * Met à jour le statut d'une commande
 * - Acheteur: peut annuler (→ cancelled)
 * - Vendeur: peut confirmer (→ confirmed), expédier (→ shipped), livrer (→ delivered)
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
): Promise<void> {
  // Cast en any car les timestamps optionnels ne sont pas tous dans le type Update
  const updates: Record<string, any> = { status }

  // Timestamps selon le statut
  if (status === 'confirmed') updates.confirmed_at = new Date().toISOString()
  if (status === 'completed') updates.completed_at = new Date().toISOString()
  if (status === 'cancelled') updates.cancelled_at = new Date().toISOString()

  const { error } = await supabase
    .from('orders')
    .update(updates as any)
    .eq('id', orderId)

  if (error) throw new Error(`updateOrderStatus: ${error.message}`)
}

// ============================================================
// STATS — Tableau de bord
// ============================================================

export interface SellerStats {
  totalListings: number
  activeListings: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  totalViews: number
}

/**
 * Statistiques du vendeur connecté
 */
export async function fetchSellerStats(): Promise<SellerStats> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  // Offres du vendeur
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('id, status, views')
    .eq('seller_id', user.id)

  // Commandes reçues
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_price')
    .eq('seller_id', user.id)

  const totalListings = listings?.length ?? 0
  const activeListings = listings?.filter(l => l.status === 'available').length ?? 0
  const totalOrders = orders?.length ?? 0
  const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'confirmed').length ?? 0
  const totalRevenue = orders
    ?.filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_price), 0) ?? 0
  const totalViews = listings?.reduce((sum, l) => sum + (l.views ?? 0), 0) ?? 0

  return { totalListings, activeListings, totalOrders, pendingOrders, totalRevenue, totalViews }
}

export interface BuyerStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalSpent: number
}

/**
 * Statistiques de l'acheteur connecté
 */
export async function fetchBuyerStats(): Promise<BuyerStats> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_price')
    .eq('buyer_id', user.id)

  const totalOrders = orders?.length ?? 0
  const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'confirmed').length ?? 0
  const completedOrders = orders?.filter(o => o.status === 'completed').length ?? 0
  const totalSpent = orders
    ?.filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_price), 0) ?? 0

  return { totalOrders, pendingOrders, completedOrders, totalSpent }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Map les statuts DB (pending, confirmed, processing, completed, cancelled)
 * vers les statuts UI (confirmed, preparing, shipped, delivered, cancelled)
 */
function mapOrderStatus(dbStatus: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    pending: 'confirmed',      // pending → confirmed (affiché comme "Confirmée")
    confirmed: 'confirmed',
    processing: 'preparing',
    completed: 'delivered',
    cancelled: 'cancelled',
    shipped: 'shipped',
  }
  return map[dbStatus] ?? 'confirmed'
}