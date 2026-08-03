import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Search, Plus, MapPin, ShoppingCart, Leaf, TrendingUp, Package,
  ShoppingBag, MessageCircle, X, ChevronDown, SlidersHorizontal,
  Star, Clock, Eye, Store, Sprout,
} from 'lucide-react'
import { fetchOffers } from '@/lib/marketplace'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { Offer } from '@/types/marketplace'
import type { ProductCategory } from '@/types/marketplace'

export const Route = createFileRoute('/marketplace')({
  component: MarketplacePage,
})

// ─── Constantes ──────────────────────────────────────────

const CATEGORIES: { value: ProductCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Tous', icon: '🌱' },
  { value: 'tomates', label: 'Tomates', icon: '🍅' },
  { value: 'oignons', label: 'Oignons', icon: '🧅' },
  { value: 'mil', label: 'Mil', icon: '🌾' },
  { value: 'sorgho', label: 'Sorgho', icon: '🌾' },
  { value: 'mais', label: 'Maïs', icon: '🌽' },
  { value: 'niebe', label: 'Niébé', icon: '🫘' },
  { value: 'arachide', label: 'Arachide', icon: '🥜' },
  { value: 'coton', label: 'Coton', icon: '☁️' },
  { value: 'mangue', label: 'Mangue', icon: '🥭' },
  { value: 'autre', label: 'Autre', icon: '📦' },
]

const REGIONS = [
  'Toutes', 'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est',
  'Centre-Nord', 'Centre-Ouest', 'Centre-Sud', 'Est', 'Hauts-Bassins',
  'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest',
]

type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'popular'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Plus populaires' },
]

// ─── Page Principale ──────────────────────────────────────

function MarketplacePage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('Toutes')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const loadOffers = useCallback(async (append = false) => {
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)

      const offset = append ? offers.length : 0
      const response = await fetchOffers({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        region: selectedRegion === 'Toutes' ? undefined : selectedRegion,
        search: searchTerm || undefined,
        sortBy: sortBy === 'recent' || sortBy === 'popular' ? 'created_at' : 'price',
        sortOrder: sortBy === 'price_asc' ? 'asc' : 'desc',
        limit: 12,
        offset,
      })

      setOffers(append ? [...offers, ...response.offers] : response.offers)
      setHasMore(response.hasMore)
      setTotalCount(response.total)
    } catch (error) {
      console.error('Failed to load offers:', error)
      if (!append) setOffers([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedCategory, selectedRegion, sortBy, searchTerm, offers.length])

  // Debounce recherche
  useEffect(() => {
    const t = setTimeout(() => loadOffers(false), 350)
    return () => clearTimeout(t)
  }, [selectedCategory, selectedRegion, sortBy])

  useEffect(() => { loadOffers(false) }, [searchTerm])

  function reloadOffers() { loadOffers(false) }

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedRegion !== 'Toutes' ? 1 : 0)

  function clearFilters() {
    setSelectedCategory('all')
    setSelectedRegion('Toutes')
    setSortBy('recent')
    setSearchTerm('')
  }

  const sortedOffers = useMemo(() => {
    if (sortBy === 'price_asc') return [...offers].sort((a, b) => a.price - b.price)
    if (sortBy === 'price_desc') return [...offers].sort((a, b) => b.price - a.price)
    return offers
  }, [offers, sortBy])

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ═══ Header compact ═══ */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg shrink-0">
              <Sprout className="w-5 h-5" />
              <span className="hidden sm:inline">AgroField</span>
            </Link>

            {/* Recherche centrée (desktop) */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, une région..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 bg-background border-0"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link to="/marketplace/messages" className="md:hidden">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/marketplace/my-offers" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Package className="w-4 h-4 mr-1.5" />
                  Mes offres
                </Button>
              </Link>
              <Link to="/marketplace/orders" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <ShoppingBag className="w-4 h-4 mr-1.5" />
                  Commandes
                </Button>
              </Link>
              <Link to="/marketplace/create">
                <Button size="sm" className="bg-background text-primary hover:bg-background/90 gap-1.5 font-semibold">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Publier</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Bandeau catégories ═══ */}
      <div className="bg-background border-b sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Barre filtres + tri ═══ */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Recherche mobile */}
            <div className="relative flex-1 md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            {/* Compteur */}
            <p className="text-sm text-muted-foreground hidden md:block">
              {loading ? 'Chargement...' : `${totalCount} offre${totalCount > 1 ? 's' : ''}`}
              {activeFiltersCount > 0 && ` · ${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''}`}
            </p>

            {/* Tri + filtres */}
            <div className="flex items-center gap-2 shrink-0">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="h-9 w-auto text-sm gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtres mobile (Sheet) */}
              <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 md:hidden relative">
                    <SlidersHorizontal className="w-4 h-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96">
                  <SheetHeader>
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-6 space-y-5 mt-4">
                    {/* Région */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Région</label>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Tri */}
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Trier par</label>
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1" onClick={clearFilters}>
                        Réinitialiser
                      </Button>
                      <Button className="flex-1" onClick={() => setShowMobileFilters(false)}>
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Filtre région desktop */}
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="h-9 w-auto text-sm gap-1.5 hidden md:flex">
                  <MapPin className="w-3.5 h-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Contenu ═══ */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {loading ? (
          <LoadingGrid />
        ) : sortedOffers.length === 0 ? (
          <EmptyState
            onReset={clearFilters}
            onCreate={() => router.navigate({ to: '/marketplace/create' })}
            hasFilters={activeFiltersCount > 0 || !!searchTerm}
          />
        ) : (
          <>
            {/* Grille produits */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {sortedOffers.map((offer) => (
                <ProductCard
                  key={offer.id}
                  offer={offer}
                  user={user}
                  onDelete={reloadOffers}
                />
              ))}
            </div>

            {/* Pagination infinie */}
            {hasMore && (
              <div className="text-center mt-8 mb-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => loadOffers(true)}
                  disabled={loadingMore}
                  className="border-primary text-primary hover:bg-primary/5 px-8 h-11"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Charger plus
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ─── ProductCard ──────────────────────────────────────────

function ProductCard({ offer, user, onDelete }: { offer: Offer; user: any; onDelete?: () => void }) {
  const router = useRouter()
  const isOwner = user?.id === offer.sellerId

  const statusConfig: Record<string, { label: string; className: string }> = {
    available: { label: 'Disponible', className: 'bg-emerald-100 text-emerald-700' },
    reserved: { label: 'Réservé', className: 'bg-amber-100 text-amber-700' },
    sold: { label: 'Vendu', className: 'bg-muted text-muted-foreground' },
    expired: { label: 'Expiré', className: 'bg-red-100 text-red-700' },
  }

  const status = statusConfig[offer.status] || statusConfig.available

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Supprimer "${offer.title}" ?`)) return
    try {
      const { error } = await supabase.from('marketplace_listings').delete().eq('id', offer.id)
      if (error) throw error
      toast.success('Offre supprimée')
      onDelete?.()
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    }
  }

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden p-0 gap-0"
      onClick={() => router.navigate({ to: '/marketplace/$id', params: { id: offer.id } })}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {offer.images && offer.images.length > 0 ? (
          <img
            src={offer.images[0]}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <Store className="w-10 h-10 text-primary/30" />
          </div>
        )}
        {/* Badge statut */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.className}`}>
          {status.label}
        </span>
        {/* Badge quantité */}
        {offer.status === 'available' && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-background/90 text-foreground backdrop-blur-sm">
            {offer.quantity} {offer.unit}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3 space-y-1.5">
        {/* Catégorie */}
        <p className="text-[11px] text-muted-foreground capitalize font-medium">{offer.category}</p>

        {/* Titre */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
          {offer.title}
        </h3>

        {/* Prix */}
        <div className="flex items-baseline gap-1 pt-0.5">
          <span className="text-lg font-bold text-primary">
            {offer.price.toLocaleString('fr-FR')}
          </span>
          <span className="text-[11px] text-muted-foreground">F/{offer.unit}</span>
        </div>

        {/* Localisation */}
        <div className="flex items-center text-[11px] text-muted-foreground pt-1 border-t">
          <MapPin className="w-3 h-3 mr-1 shrink-0" />
          <span className="line-clamp-1">{offer.location}</span>
        </div>

        {/* Stats + actions */}
        <div className="flex items-center justify-between pt-1.5">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {offer.views}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="w-3 h-3" />
              {offer.contacts}
            </span>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); router.navigate({ to: '/marketplace/$id/edit', params: { id: offer.id } }) }}
                className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── LoadingGrid ──────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {[...Array(10)].map((_, i) => (
        <Card key={i} className="p-0 gap-0 overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────

function EmptyState({ onReset, onCreate, hasFilters }: { onReset: () => void; onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
        <Leaf className="w-10 h-10 text-primary/40" />
      </div>
      <h3 className="text-lg font-semibold mb-1.5">
        {hasFilters ? 'Aucun résultat' : 'Aucune offre publiée'}
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm">
        {hasFilters
          ? 'Essayez de modifier vos critères de recherche ou réinitialisez les filtres.'
          : 'Soyez le premier à publier une offre sur la marketplace.'}
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {hasFilters && (
          <Button variant="outline" onClick={onReset} className="border-primary text-primary">
            <X className="w-4 h-4 mr-1.5" />
            Réinitialiser
          </Button>
        )}
        <Button onClick={onCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1.5" />
          Publier une offre
        </Button>
      </div>
    </div>
  )
}

export { MarketplacePage }