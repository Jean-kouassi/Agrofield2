import { useState, useMemo, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Search,
  SlidersHorizontal,
  Home,
  ClipboardList,
  Plus,
  Sprout,
  MessageCircle,
  LayoutGrid,
  ShoppingBag,
  Bell,
  User,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CATEGORIES,
  type MarketplaceListing as MarketplaceListingType,
  type MarketplaceOrder as MarketplaceOrderType,
  type MarketplaceConversation,
  fcfa,
} from '@/lib/marketplace-data'
import { supabase } from '@/integrations/supabase/client'
import { fetchListings, getCurrentUser } from '@/lib/marketplace.service'
import type { FilterValues } from './filter-drawer'
import { ProductCard, ProductSkeleton, EmptyState } from './product-card'
import { FilterDrawer } from './filter-drawer'
import { ProductDetailModal } from './product-detail-modal'
import { PublishModal } from './publish-modal'
import { SellerDashboard } from './seller-dashboard'
import { BuyerDashboard } from './buyer-dashboard'
import { OrdersView } from './orders-view'
import { MessagesView } from './messages-view'
import { PriceTicker } from './price-ticker'
import { MOCK_CONVERSATIONS } from '@/lib/marketplace-data'

export type MarketplaceTab = 'home' | 'buyer' | 'offers' | 'orders' | 'messages'

interface MarketplaceShellProps {
  initialTab?: MarketplaceTab
}

export function MarketplaceShell({ initialTab = 'home' }: MarketplaceShellProps) {
  const [tab, setTab] = useState<MarketplaceTab>(initialTab)
  const [listings, setListings] = useState<MarketplaceListingType[]>([])
  const [orders, setOrders] = useState<MarketplaceOrderType[]>([])
  const [conversations] = useState<MarketplaceConversation[]>(MOCK_CONVERSATIONS)

  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({
    priceMin: '',
    priceMax: '',
    region: 'all',
    availability: 'all',
    saleType: 'all',
  })

  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceListingType | null>(null)
  const [jumpToOrder, setJumpToOrder] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [toast, setToast] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Load current user and data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        // Fetch listings from Supabase
        const fetchedListings = await fetchListings()
        setListings(fetchedListings)
        
        // OrdersView gère son propre chargement par rôle (acheteur/vendeur)
      } catch (error) {
        console.error('Error loading marketplace data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (activeCategory !== 'all' && l.category !== activeCategory) return false
      if (
        query.trim() &&
        !`${l.title} ${l.seller} ${l.region} ${l.city}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      )
        return false
      if (filters.priceMin && l.price < Number(filters.priceMin)) return false
      if (filters.priceMax && l.price > Number(filters.priceMax)) return false
      if (filters.region !== 'all' && l.region !== filters.region) return false
      if (filters.availability !== 'all' && l.status !== filters.availability)
        return false
      if (filters.saleType !== 'all' && l.saleType !== filters.saleType) return false
      return true
    })
  }, [listings, query, activeCategory, filters])

  const heroStats = [
    {
      label: 'Offres actives',
      value: listings
        .filter((l) => l.status === 'available')
        .length.toLocaleString('fr-FR'),
    },
    {
      label: 'Valeur totale',
      value:
        (
          listings.reduce((a, l) => a + l.price * l.qty, 0) / 1000000
        ).toFixed(1) + 'M FCFA',
    },
    {
      label: 'Prix moyen',
      value: fcfa(
        Math.round(listings.reduce((a, l) => a + l.price, 0) / listings.length)
      ),
    },
    { label: 'Catégories', value: CATEGORIES.length.toString() },
  ]

  const myListings = listings.filter((l) => currentUser && l.seller === currentUser.email?.split('@')[0])

  function resetFilters() {
    setFilters({
      priceMin: '',
      priceMax: '',
      region: 'all',
      availability: 'all',
      saleType: 'all',
    })
    setActiveCategory('all')
    setQuery('')
  }

  async function handlePublish(data: Partial<MarketplaceListingType>) {
    try {
      const { createListing } = await import('@/lib/marketplace.service')
      const newListing = await createListing({
        title: data.title || 'Nouvelle offre',
        category: data.category || 'legumes',
        description: data.desc || '',
        price: data.price || 0,
        quantity: data.qty || 0,
        unit: data.unit || 'kg',
        location: data.city || 'Ouagadougou',
        region: data.region || 'Centre',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      
      setListings((ls) => [newListing, ...ls])
      setShowPublish(false)
      setTab('offers')
      setToast('Votre offre a été publiée avec succès.')
    } catch (error: any) {
      setToast(error.message || 'Erreur lors de la publication')
    }
  }

  function handleDelete(listing: MarketplaceListingType) {
    import('@/lib/marketplace.service').then(m => m.deleteListing(listing.id))
      .then(() => {
        setListings((ls) => ls.filter((l) => l.id !== listing.id))
        setToast(`"${listing.title}" a été supprimée.`)
      })
      .catch(err => {
        console.error('Error deleting listing:', err)
        setToast('Erreur lors de la suppression')
      })
  }

  function handleEdit(listing: MarketplaceListingType) {
    setToast(`Modification de "${listing.title}" (démo).`)
  }

  async function handlePlaceOrder(order: Omit<MarketplaceOrderType, 'id'>) {
    try {
      const { createOrder } = await import('@/lib/marketplace.service')
      const newOrder = await createOrder({
        seller_id: order.seller,
        offer_id: '', // Would need to get from listing
        quantity: order.qty,
        total_price: order.total,
        status: 'pending',
        payment_method: 'mobile_money',
        notes: null,
      })
      
      setOrders((os) => [newOrder, ...os])
      setToast('Commande créée avec succès!')
    } catch (error: any) {
      console.error('Error creating order:', error)
      setToast(error.message || 'Erreur lors de la commande')
    }
  }

  return (
    <div className="af-root min-h-screen pb-24 md:pb-10">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b"
        style={{ borderColor: 'var(--agro-border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          {/* Bouton retour Accueil général — toujours visible */}
          <Link 
            to="/" 
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold shrink-0 no-underline transition-colors"
            style={{ color: 'var(--agro-primary)' }}
            title="Retour à l'accueil"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Accueil</span>
          </Link>

          <div className="w-px h-6 shrink-0" style={{ background: 'var(--agro-border)' }} />

          <Link to="/" className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 no-underline"
            style={{ background: 'var(--agro-primary)' }}
          >
            <img src="/favicon.ico" alt="AgroField" className="h-6 w-6 object-contain" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="af-display font-extrabold text-base leading-tight">
              AgroField Marketplace
            </div>
            <div className="text-xs hidden sm:block text-muted-foreground">
              Achetez et vendez directement entre producteurs
            </div>
          </div>

          <DesktopNav tab={tab} setTab={setTab} onPublish={() => setShowPublish(true)} />

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--agro-danger)' }} />
          </Button>

          <div
            className="w-9 h-9 rounded-full flex items-center justify-center af-display font-bold text-white text-xs shrink-0"
            style={{ background: 'var(--agro-accent)' }}
          >
            VS
          </div>
        </div>
      </header>

      {tab === 'home' && (
        <>
          <section className="pt-6 pb-4">
            <div className="max-w-6xl mx-auto px-4 md:px-6 mb-5">
              <p className="af-display text-xs font-bold tracking-wide uppercase mb-2"
                style={{ color: 'var(--agro-accent)' }}
              >
                Marché agricole du Burkina Faso
              </p>
              <h1 className="af-display font-extrabold text-2xl md:text-4xl leading-tight max-w-2xl">
                Vendez votre récolte, achetez local, en direct des champs.
              </h1>
              <p className="text-sm md:text-base mt-2 max-w-xl text-muted-foreground">
                Des milliers d'agriculteurs et coopératives publient leurs disponibilités chaque semaine, du mil de l'Est aux mangues des Hauts-Bassins.
              </p>
            </div>
            <HeroStats stats={heroStats} />
          </section>

          <PriceTicker />

          <div className="max-w-6xl mx-auto px-4 md:px-6 pt-5">
            <div className="flex gap-2">
              <div
                className="af-input rounded-xl flex items-center gap-2 px-3.5 flex-1"
                style={{ height: 48 }}
              >
                <Search size={18} className="text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un produit, un vendeur, une région..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="af-btn-ghost rounded-xl px-3.5 inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
                style={{ height: 48 }}
              >
                <SlidersHorizontal size={16} />{' '}
                <span className="hidden sm:inline">Filtres</span>
              </Button>
            </div>

            <div className="flex gap-2 mt-4 overflow-x-auto af-scrollbar-hide pb-1">
              <Button
                variant="outline"
                onClick={() => setActiveCategory('all')}
                className={cn(
                  'af-chip rounded-full px-4 py-2 text-sm font-semibold shrink-0',
                  activeCategory === 'all' && 'af-chip-active'
                )}
              >
                Tout
              </Button>
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                return (
                  <Button
                    key={c.id}
                    variant="outline"
                    onClick={() => setActiveCategory(c.id)}
                    className={cn(
                      'af-chip rounded-full px-4 py-2 text-sm font-semibold shrink-0 inline-flex items-center gap-1.5',
                      activeCategory === c.id && 'af-chip-active'
                    )}
                  >
                    <Icon size={14} /> {c.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((l) => (
                  <ProductCard
                    key={l.id}
                    listing={l}
                    onSelect={(item, order) => {
                      setSelectedProduct(item)
                      setJumpToOrder(!!order)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'buyer' && (
        <BuyerDashboard
          onBrowse={() => setTab('home')}
          onSelectProduct={(item) => setSelectedProduct(item)}
        />
      )}

      {tab === 'offers' && (
        <SellerDashboard
          myListings={myListings}
          onPublish={() => setShowPublish(true)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {tab === 'orders' && <OrdersView />}

      {tab === 'messages' && <MessagesView conversations={conversations} />}

      <BottomNav tab={tab} setTab={setTab} onPublish={() => setShowPublish(true)} />

      {selectedProduct && (
        <ProductDetailModal
          listing={selectedProduct}
          allListings={listings}
          jumpToOrder={jumpToOrder}
          onSelect={(l) => {
            setSelectedProduct(l)
            setJumpToOrder(false)
          }}
          onClose={() => {
            setSelectedProduct(null)
            setJumpToOrder(false)
          }}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {showPublish && (
        <PublishModal
          onClose={() => setShowPublish(false)}
          onPublish={handlePublish}
        />
      )}

      {showFilters && (
        <FilterDrawer
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilters(false)}
          onApply={(f) => {
            setFilters(f)
            setShowFilters(false)
          }}
        />
      )}

      {toast && (
        <div
          className="af-toast fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card shadow-xl rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-medium border"
          style={{ borderColor: 'var(--agro-border)' }}
        >
          <Sprout size={16} className="text-primary" /> {toast}
        </div>
      )}
    </div>
  )
}

function HeroStats({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto af-scrollbar-hide px-4 md:px-6 pb-1">
      {stats.map((s) => (
        <Card key={s.label} className="af-card rounded-xl px-4 py-3 af-stat-card shrink-0">
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="af-display text-lg font-extrabold text-primary">{s.value}</div>
        </Card>
      ))}
    </div>
  )
}

function BottomNav({
  tab,
  setTab,
  onPublish,
}: {
  tab: MarketplaceTab
  setTab: (t: MarketplaceTab) => void
  onPublish: () => void
}) {
  const items = [
    { id: 'home', label: 'Marché', icon: Home },
    { id: 'buyer', label: 'Acheter', icon: ShoppingBag },
    { id: 'offers', label: 'Mes offres', icon: LayoutGrid },
    { id: 'orders', label: 'Commandes', icon: ClipboardList },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t"
      style={{ borderColor: 'var(--agro-border)' }}
    >
      <div className="relative flex items-stretch justify-between px-2">
        {/* Lien Accueil général — toujours à gauche */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 af-nav-item shrink-0"
          style={{ minHeight: 56, minWidth: 48 }}
          title="Accueil AgroField"
        >
          <Sprout size={20} />
          <span className="af-text-10 font-medium">AgroField</span>
        </Link>

        {items.slice(0, 1).map((it) => {
          const Icon = it.icon
          const isActive = tab === it.id
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id as MarketplaceTab)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 af-nav-item',
                isActive && 'af-nav-item-active'
              )}
              style={{ minHeight: 56 }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="af-text-10 font-medium">{it.label}</span>
            </button>
          )
        })}

        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onPublish}
            className="af-fab -mt-6 rounded-full w-14 h-14 flex items-center justify-center text-white"
          >
            <Plus size={26} />
          </button>
        </div>

        {items.slice(1, 3).map((it) => {
          const Icon = it.icon
          const isActive = tab === it.id
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id as MarketplaceTab)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 af-nav-item',
                isActive && 'af-nav-item-active'
              )}
              style={{ minHeight: 56 }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="af-text-10 font-medium">{it.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function DesktopNav({
  tab,
  setTab,
  onPublish,
}: {
  tab: MarketplaceTab
  setTab: (t: MarketplaceTab) => void
  onPublish: () => void
}) {
  const items = [
    { id: 'home', label: 'Marché', icon: Home },
    { id: 'buyer', label: 'Acheter', icon: ShoppingBag },
    { id: 'offers', label: 'Mes offres', icon: LayoutGrid },
    { id: 'orders', label: 'Commandes', icon: ClipboardList },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
  ]

  return (
    <div className="hidden md:flex items-center gap-1">
      {items.map((it) => {
        const Icon = it.icon
        const isActive = tab === it.id
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id as MarketplaceTab)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold af-nav-item',
              isActive && 'af-nav-item-active'
            )}
            style={{
              background: isActive ? 'var(--agro-pale)' : 'transparent',
            }}
          >
            <Icon size={16} /> {it.label}
          </button>
        )
      })}
      <Button
        onClick={onPublish}
        className="af-btn-accent rounded-lg px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 ml-2"
      >
        <Plus size={16} /> Publier une offre
      </Button>
    </div>
  )
}
