import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import type { MarketplaceListing, MarketplaceOrder } from './marketplace-data'
import { mapSupabaseListing, mapSupabaseOrder } from './marketplace-data'

// Re-export frontend types for convenience
export type { MarketplaceListing, MarketplaceOrder }

export type MarketplaceListingInsert = Database['public']['Tables']['marketplace_listings']['Insert']
export type MarketplaceListingUpdate = Database['public']['Tables']['marketplace_listings']['Update']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }
  return user
}

/**
 * Fetch all available marketplace listings (public)
 */
export async function fetchListings(filters?: {
  category?: string
  region?: string
  status?: string
  search?: string
}) {
  let query = supabase
    .from('marketplace_listings')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.region) {
    query = query.eq('region', filters.region)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching listings:', error)
    return []
  }

  // Map to frontend format
  return (data || []).map(mapSupabaseListing)
}

/**
 * Fetch seller's own listings (requires auth)
 */
export async function fetchMyListings() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching my listings:', error)
    return []
  }

  // Map to frontend format
  return (data || []).map(mapSupabaseListing)
}

/**
 * Create a new marketplace listing
 */
export async function createListing(listing: Omit<MarketplaceListingInsert, 'seller_id' | 'seller_name'>): Promise<MarketplaceListing> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('You must be logged in to publish an offer')
  }

  // Get user's name from metadata or email
  const sellerName = user.user_metadata?.name || user.email?.split('@')[0] || 'Vendeur'

  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      ...listing,
      seller_id: user.id,
      seller_name: sellerName,
      expires_at: listing.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    throw error
  }

  // Map to frontend format
  return mapSupabaseListing(data)
}

/**
 * Update a marketplace listing (only if owner)
 */
export async function updateListing(id: string, updates: MarketplaceListingUpdate) {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating listing:', error)
    throw error
  }

  return data
}

/**
 * Delete a marketplace listing (only if owner)
 */
export async function deleteListing(id: string) {
  const { error } = await supabase
    .from('marketplace_listings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting listing:', error)
    throw error
  }
}

/**
 * Increment view count for a listing
 */
export async function incrementViews(id: string) {
  try {
    // Simple manual increment
    const { data } = await supabase
      .from('marketplace_listings')
      .select('views')
      .eq('id', id)
      .single()
    
    if (data) {
      await supabase
        .from('marketplace_listings')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id)
    }
  } catch (err) {
    console.error('Error incrementing views:', err)
  }
}

/**
 * Fetch orders for current user (as buyer or seller)
 */
export async function fetchMyOrders() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  // Map to frontend format
  return (data || []).map(mapSupabaseOrder)
}

/**
 * Create a new order
 */
export async function createOrder(order: Omit<OrderInsert, 'buyer_id'>): Promise<MarketplaceOrder> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('You must be logged in to place an order')
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...order,
      buyer_id: user.id,
      status: order.status || 'pending',
      payment_method: order.payment_method || 'mobile_money',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating order:', error)
    throw error
  }

  // Map to frontend format
  return mapSupabaseOrder(data)
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: Order['status']) {
  const updates: OrderUpdate = { status }
  
  if (status === 'confirmed') {
    updates.confirmed_at = new Date().toISOString()
  } else if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  } else if (status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error updating order:', error)
    throw error
  }

  return data
}

/**
 * Get listing by ID
 */
export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching listing:', error)
    return null
  }

  return data
}
