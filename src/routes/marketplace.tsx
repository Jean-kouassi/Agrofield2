import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, Filter, MapPin, ShoppingCart, Leaf, TrendingUp, Users, Zap } from 'lucide-react'
import { fetchOffers, type Offer } from '@/lib/marketplace'
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
      setOffers(response.offers)
    } catch (error) {
      console.error('Failed to load offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOffers = offers.filter(offer => {
    if (!searchTerm) return true
    return offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           offer.description.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Stats rapides
  const totalValue = offers.reduce((sum, o) => sum + (o.price * o.quantity), 0)
  const avgPrice = offers.length > 0 ? totalValue / offers.reduce((sum, o) => sum + o.quantity, 0) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header avec Gradient */}
      <header className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              to="/"
              className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
            >
              <Leaf className="w-6 h-6" />
              <span>AgroField</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Button 
                size="lg"
                className="bg-white text-green-600 hover:bg-green-50 gap-2 shadow-lg"
                onClick={() => router.navigate({ to: '/marketplace/create' })}
              >
                <Plus className="w-5 h-5" />
                Publier une offre
              </Button>
            </nav>
          </div>

          {/* Titre Principal */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center justify-center gap-3">
              <ShoppingCart className="w-12 h-12" />
              Marketplace AgroField
            </h1>
            <p className="text-green-100 text-lg max-w-2xl mx-auto">
              La plateforme d'échange agricole nouvelle génération 🌾
            </p>
          </div>

          {/* Stats Rapides */}
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

      {/* Contenu Principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Barre de recherche et filtres */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher un produit (tomate, oignon, mil...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-2 border-green-200 focus:border-green-500"
            />
          </div>

          {/* Filtres Catégories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Grille des Offres */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-2">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune offre trouvée</h3>
            <p className="text-gray-500 mb-6">Soyez le premier à publier une offre !</p>
            <Button
              onClick={() => router.navigate({ to: '/marketplace/create' })}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Publier une offre
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl ${color} backdrop-blur-sm p-4 border border-white/20`}>
      <div className="flex items-center gap-2 mb-2 text-white">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Card className="border-2 hover:shadow-xl transition-all duration-300 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold group-hover:text-green-600 transition-colors">
              {offer.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <MapPin className="w-3 h-3" />
              {offer.region || 'Localisation non spécifiée'}
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {offer.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {offer.description}
        </p>
        
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-left">
            <div className="text-xs text-gray-500">Prix</div>
            <div className="text-lg font-bold text-green-600">
              {offer.price.toLocaleString('fr-FR')} FCFA/{offer.unit}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Quantité</div>
            <div className="text-sm font-semibold">
              {offer.quantity} {offer.unit}
            </div>
          </div>
        </div>

        <Link to={`/marketplace/${offer.id}`}>
          <Button className="w-full bg-green-600 hover:bg-green-700 mt-2">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Voir les détails
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// Import manquant pour Link (DÉJÀ IMPORTÉ EN HAUT - NE PAS SUPPRIMER)
// import { Link } from '@tanstack/react-router'
