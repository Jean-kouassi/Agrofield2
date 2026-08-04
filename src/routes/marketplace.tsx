import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, Filter, MapPin, ShoppingCart, Leaf, TrendingUp, Users, Zap, Package, ShoppingBag } from 'lucide-react'
import { fetchOffers } from '@/lib/marketplace'
import { useNetworkStatus } from '@/lib/network-detection'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { Offer } from '@/types/marketplace'
import type { ProductCategory } from '@/types/marketplace'

export const Route = createFileRoute('/marketplace')({
  component: MarketplacePage,
})

function MarketplacePage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')

  const categories: (ProductCategory | 'all')[] = [
    'all',
    'tomates',
    'oignons',
    'mil',
    'sorgho',
    'mais',
    'niebe',
    'arachide',
    'mangue',
    'autre'
  ]

  useEffect(() => {
    loadOffers()
  }, [selectedCategory])

  async function loadOffers() {
    try {
      setLoading(true)
      const response = await fetchOffers({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchTerm || undefined,
        limit: 20,
      })
      setOffers(response.offers || [])
    } catch (error) {
      console.error('Failed to load offers:', error)
      setOffers([])
    } finally {
      setLoading(false)
    }
  }

  function reloadOffers() {
    loadOffers()
  }

  const filteredOffers = offers.filter(offer => {
    if (!searchTerm) return true
    return offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           offer.description.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalValue = offers.reduce((sum, o) => sum + (o.price * o.quantity), 0)
  const avgPrice = offers.length > 0 ? totalValue / offers.reduce((sum, o) => sum + o.quantity, 0) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <Link 
              to="/"
              className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
            >
              <Leaf className="w-6 h-6" />
              <span>AgroField</span>
            </Link>
            
            <nav className="flex items-center gap-2 md:gap-4 flex-wrap">
              <Link 
                to="/"
                className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                ← Accueil
              </Link>
              <Link 
                to="/marketplace/my-offers"
                className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                <Package className="w-4 h-4" />
                Mes offres
              </Link>
              <Link 
                to="/marketplace/orders"
                className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                <ShoppingBag className="w-4 h-4" />
                Mes commandes
              </Link>
              <Link to="/marketplace/create">
                <Button 
                  size="lg"
                  className="bg-white text-green-600 hover:bg-green-50 gap-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Publier une offre
                </Button>
              </Link>
            </nav>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center justify-center gap-3">
              <ShoppingCart className="w-12 h-12" />
              Marketplace AgroField
            </h1>
            <p className="text-green-100 text-lg max-w-2xl mx-auto">
              La plateforme d'échange agricole nouvelle génération 🌾
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <StatCard 
              icon={<Leaf className="w-5 h-5" />}
              label="Offres Actives"
              value={offers.length.toString()}
              color="bg-green-500/20"
            />
            <StatCard 
              icon={<TrendingUp className="w-5 h-5" />}
              label="Valeur Totale"
              value={`${(totalValue / 1000).toFixed(1)}K FCFA`}
              color="bg-blue-500/20"
            />
            <StatCard 
              icon={<Users className="w-5 h-5" />}
              label="Prix Moyen"
              value={`${Math.round(avgPrice)} FCFA`}
              color="bg-purple-500/20"
            />
            <StatCard 
              icon={<Zap className="w-5 h-5" />}
              label="Catégories"
              value={new Set(offers.map(o => o.category)).size.toString()}
              color="bg-yellow-500/20"
            />
          </div>
        </div>
      </header>

      {/* Barre de Recherche et Filtres */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Rechercher un produit, un vendeur, une région..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-green-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap capitalize transition-all ${
                    selectedCategory === category 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'hover:bg-green-50 hover:border-green-300'
                  }`}
                >
                  {category === 'all' ? 'Tous' : category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <EmptyState onReset={() => { setSearchTerm(''); setSelectedCategory('all'); }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onDelete={reloadOffers} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-6 h-6 text-green-400" />
            <span className="text-xl font-bold">AgroField</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 AgroField - Application pour agriculteurs du Burkina Faso 🇧🇫
          </p>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`${color} backdrop-blur-sm rounded-xl p-4 text-center`}>
      <div className="flex justify-center mb-2 text-white">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/80">{label}</div>
    </div>
  )
}

function OfferCard({ offer, onDelete }: { offer: Offer; onDelete?: () => void }) {
  const router = useRouter()
  const { quality } = useNetworkStatus()
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [offer.sellerId])
  
  const isOwner = user && offer.sellerId === user.id
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      tomates: 'from-red-500 to-red-600',
      oignons: 'from-purple-500 to-purple-600',
      mil: 'from-yellow-500 to-yellow-600',
      sorgho: 'from-orange-500 to-orange-600',
      mais: 'from-amber-400 to-amber-500',
      niebe: 'from-green-500 to-green-600',
      arachide: 'from-amber-600 to-amber-700',
      mangue: 'from-orange-400 to-orange-500',
    }
    return colors[category] || 'from-gray-500 to-gray-600'
  }

  const handleViewDetails = () => {
    router.navigate({ to: '/marketplace/$id', params: { id: offer.id } })
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Supprimer l'offre "${offer.title}" ?`)) return
    
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', offer.id)
      
      if (error) throw error
      
      toast.success('Offre supprimée avec succès')
      onDelete?.()
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    }
  }

  const handleOrder = () => {
    if (quality === 'offline') {
      toast.info('Hors ligne — Votre commande sera synchronisée dès le retour de la connexion')
    }
    router.navigate({ to: '/marketplace/$id', params: { id: offer.id } })
  }

  return (
    <Card 
      className="group hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-green-400"
      onClick={handleViewDetails}
    >
      <div className={`relative h-48 bg-gradient-to-br ${getCategoryColor(offer.category)} overflow-hidden`}>
        {offer.images && offer.images.length > 0 ? (
          <img
            src={offer.images[0]}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-20 h-20 text-white/50" />
          </div>
        )}
        
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <Badge className="bg-white/90 text-gray-800 font-semibold capitalize shadow-lg">
            {offer.category}
          </Badge>
          <Badge className={`${offer.status === 'available' ? 'bg-green-500' : 'bg-gray-500'} text-white shadow-lg`}>
            {offer.status === 'available' ? 'Disponible' : offer.status}
          </Badge>
        </div>
        
        <div className="absolute bottom-2 left-2 text-white/90 text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
          <MapPin className="w-3 h-3 inline mr-1" />
          {offer.region}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
          {offer.title}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2">
          {offer.description}
        </p>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {offer.price.toLocaleString('fr-FR')} <span className="text-sm font-normal text-gray-600">FCFA/{offer.unit}</span>
            </div>
            <div className="text-xs text-gray-500">
              {offer.quantity} {offer.unit}s disponible{offer.quantity > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
          <MapPin className="w-3 h-3 mr-1" />
          {offer.location}, {offer.region}
        </div>

        <div className="space-y-2">
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md group-hover:shadow-lg transition-all"
            onClick={handleOrder}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Commander
          </Button>
          
          {isOwner && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation()
                  router.navigate({ to: '/marketplace/$id/edit', params: { id: offer.id } })
                }}
              >
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                Supprimer
              </Button>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 text-center pt-1">
          Vendeur: <span className="font-medium text-gray-600">{offer.sellerName}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune offre trouvée</h3>
        <p className="text-gray-500 mb-6">
          Essayez de modifier vos critères de recherche ou de filtres.
        </p>
        <Button onClick={onReset} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
          Réinitialiser les filtres
        </Button>
      </div>
    </Card>
  )
}