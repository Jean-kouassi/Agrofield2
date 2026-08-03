import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Package, Plus, Edit, Trash2, Eye, ShoppingCart, Leaf } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { Offer } from '@/types/marketplace'

export const Route = createFileRoute('/marketplace/my-offers')({
  ssr: false,
  component: MyOffersPage,
})

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Réservé',
  sold: 'Vendu',
  expired: 'Expiré',
}

const statusColors: Record<string, string> = {
  available: 'bg-green-600',
  reserved: 'bg-orange-500',
  sold: 'bg-gray-500',
  expired: 'bg-red-500',
}

function MyOffersPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (!data.user) {
        toast.error('Vous devez être connecté')
        router.navigate({ to: '/auth' })
        return
      }
      loadOffers(data.user.id)
    })
  }, [])

  async function loadOffers(userId: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOffers((data || []) as unknown as Offer[])
    } catch (err: any) {
      console.error('Failed to load offers:', err)
      toast.error('Erreur lors du chargement de vos offres')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(offerId: string, title: string) {
    if (!confirm(`Supprimer l'offre "${title}" ?\n\nCette action est irréversible.`)) return

    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', offerId)

      if (error) throw error

      toast.success('✅ Offre supprimée')
      setOffers(prev => prev.filter(o => o.id !== offerId))
    } catch (err: any) {
      toast.error('❌ Erreur: ' + err.message)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Skeleton className="h-32 w-64" />
      </div>
    )
  }

  const stats = {
    total: offers.length,
    active: offers.filter(o => o.status === 'available').length,
    sold: offers.filter(o => o.status === 'sold').length,
    revenue: offers
      .filter(o => o.status === 'sold')
      .reduce((sum, o) => sum + (o.price * o.quantity), 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: '/marketplace' })}
            className="text-white hover:bg-green-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Marketplace
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Mes offres
          </h1>
          <Button
            size="sm"
            className="bg-white text-green-600 hover:bg-green-50"
            onClick={() => router.navigate({ to: '/marketplace/create' })}
          >
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle offre
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total offres</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Actives</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{stats.sold}</p>
              <p className="text-xs text-gray-500">Vendues</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.revenue.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-gray-500">FCFA (revenus)</p>
            </CardContent>
          </Card>
        </div>

        {/* Offers list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucune offre publiée</h3>
            <p className="text-gray-500 mb-4">
              Publiez votre première offre pour atteindre les acheteurs de votre région.
            </p>
            <Button
              onClick={() => router.navigate({ to: '/marketplace/create' })}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Publier une offre
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{offer.title}</h3>
                        <Badge className={`${statusColors[offer.status]} text-white text-xs`}>
                          {statusLabels[offer.status] || offer.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                        {offer.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-bold text-green-600">
                          {offer.price.toLocaleString('fr-FR')} FCFA/{offer.unit}
                        </span>
                        <span className="text-gray-500">
                          {offer.quantity} {offer.unit}s dispo
                        </span>
                        <span className="text-gray-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {offer.views} vues
                        </span>
                        <span className="text-gray-500">
                          👤 {offer.sellerName}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.navigate({ to: '/marketplace/$id', params: { id: offer.id } })}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      {offer.status === 'available' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={() => router.navigate({ to: '/marketplace/$id/edit', params: { id: offer.id } })}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(offer.id, offer.title)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}