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
import { EditOfferModal } from '@/components/marketplace/edit-offer-modal'

export const Route = createFileRoute('/_authenticated/marketplace/my-offers')({
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

interface SellerStats {
  total: number
  active: number
  sold: number
  revenue: number
  views: number
  contacts: number
}

function MyOffersPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<SellerStats>({
    total: 0,
    active: 0,
    sold: 0,
    revenue: 0,
    views: 0,
    contacts: 0,
  })
  const [editingListing, setEditingListing] = useState<Offer | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

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
      
      // Charger les offres
      const { data: offersData, error: offersError } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (offersError) throw offersError
      setOffers((offersData || []) as unknown as Offer[])

      // Charger les statistiques depuis la fonction
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_seller_stats', { p_seller_id: userId })
      
      if (!statsError && statsData && statsData.length > 0) {
        const s = statsData[0]
        setStats({
          total: Number(s.total_offers) || 0,
          active: Number(s.active_offers) || 0,
          sold: Number(s.sold_offers) || 0,
          revenue: Number(s.total_revenue) || 0,
          views: Number(s.total_views) || 0,
          contacts: Number(s.total_contacts) || 0,
        })
      } else {
        // Fallback: calcul local si la fonction n'existe pas
        calculateLocalStats(offersData || [])
      }
    } catch (err: any) {
      console.error('Failed to load offers:', err)
      toast.error('Erreur lors du chargement de vos offres')
    } finally {
      setLoading(false)
    }
  }

  function calculateLocalStats(data: any[]) {
    const total = data.length
    const active = data.filter(o => o.status === 'available').length
    const sold = data.filter(o => o.status === 'sold').length
    const revenue = data
      .filter(o => o.status === 'sold')
      .reduce((sum, o) => sum + ((o.price || 0) * (o.quantity || o.qty || 0)), 0)
    
    setStats({ total, active, sold, revenue, views: 0, contacts: 0 })
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
      // Recharger pour mettre à jour les stats
      if (user) loadOffers(user.id)
    } catch (err: any) {
      toast.error('❌ Erreur: ' + err.message)
    }
  }

  function handleEdit(offer: Offer) {
    setEditingListing(offer)
    setEditModalOpen(true)
  }

  function handleSuccess() {
    // Recharger les offres et stats après modification
    if (user) loadOffers(user.id)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Skeleton className="h-32 w-64" />
      </div>
    )
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
        {/* Stats principales */}
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
              <p className="text-2xl font-bold text-blue-600">{stats.revenue >= 1000 ? `${(stats.revenue / 1000).toFixed(1)}k` : stats.revenue}</p>
              <p className="text-xs text-gray-500">Revenu (FCFA)</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats détaillées (vues et contacts) */}
        {(stats.views > 0 || stats.contacts > 0) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Eye className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-700">{stats.views}</p>
                <p className="text-xs text-purple-600">Vues totales</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold text-orange-700">{stats.contacts}</p>
                <p className="text-xs text-orange-600">Contacts</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Liste des offres */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <Card className="p-12 text-center">
            <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">Aucune offre publiée</p>
            <Button
              className="mt-4"
              onClick={() => router.navigate({ to: '/marketplace/create' })}
            >
              Publier votre première offre
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusColors[offer.status] || 'bg-gray-500'}>
                          {statusLabels[offer.status] || offer.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(offer.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{offer.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {offer.description || offer.desc}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-bold text-green-600">
                          {offer.price?.toLocaleString('fr-FR')} FCFA / {offer.unit}
                        </span>
                        <span>Qté: {offer.quantity || offer.qty}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {offer.views || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(offer)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(offer.id, offer.title)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal de modification */}
      <EditOfferModal
        listing={editingListing}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
