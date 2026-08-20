import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Package, Plus, Edit, Trash2, Eye, ShoppingCart,
  Leaf, MapPin, Calendar, TrendingUp, MessageCircle, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { Offer } from '@/types/marketplace'

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

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  reserved: 'secondary',
  sold: 'outline',
  expired: 'destructive',
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
    total: 0, active: 0, sold: 0, revenue: 0, views: 0, contacts: 0,
  })

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
  }, [router])

  async function loadOffers(userId: string) {
    try {
      setLoading(true)

      const { data: offersData, error: offersError } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (offersError) throw offersError
      setOffers((offersData || []) as unknown as Offer[])

      // Essayer la fonction RPC, sinon calcul local
      const { data: statsData, error: statsError } = await (supabase as any)
        .rpc('get_seller_stats', { p_seller_id: userId })

      if (!statsError && statsData && (statsData as any[]).length > 0) {
        const s = (statsData as any[])[0]
        setStats({
          total: Number(s.total_offers) || 0,
          active: Number(s.active_offers) || 0,
          sold: Number(s.sold_offers) || 0,
          revenue: Number(s.total_revenue) || 0,
          views: Number(s.total_views) || 0,
          contacts: Number(s.total_contacts) || 0,
        })
      } else {
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
      .reduce((sum, o) => sum + ((o.price || 0) * (o.quantity || 0)), 0)
    const views = data.reduce((sum, o) => sum + (o.views || 0), 0)
    const contacts = data.reduce((sum, o) => sum + (o.contacts || 0), 0)

    setStats({ total, active, sold, revenue, views, contacts })
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
      if (user) loadOffers(user.id)
    } catch (err: any) {
      toast.error('❌ Erreur: ' + err.message)
    }
  }

  // ─── Not authenticated ───
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-32 w-64" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: '/marketplace' })}
            style={{ minHeight: 48 }}
            aria-label="Retour au marketplace"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Marketplace
          </Button>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Mes offres
          </h1>
          <Button
            size="sm"
            onClick={() => router.navigate({ to: '/marketplace/create' })}
            style={{ minHeight: 44 }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Nouvelle offre
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-6 p-4">
        {/* ─── Stats Cards ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total offres</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Actives</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.sold}</p>
              <p className="text-xs text-muted-foreground">Vendues</p>
            </CardContent>
          </Card>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent-foreground">
                {stats.revenue >= 1000 ? `${(stats.revenue / 1000).toFixed(1)}k` : stats.revenue}
              </p>
              <p className="text-xs text-muted-foreground">Revenu (FCFA)</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Secondary Stats (views + contacts) ─── */}
        {(stats.views > 0 || stats.contacts > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-muted p-2">
                  <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.views}</p>
                  <p className="text-xs text-muted-foreground">Vues totales</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-muted p-2">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.contacts}</p>
                  <p className="text-xs text-muted-foreground">Contacts</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Offers List ─── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 w-fit rounded-full bg-muted p-4">
              <Leaf className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-lg font-medium text-foreground">Aucune offre publiée</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Commencez à vendre vos produits sur le marketplace
            </p>
            <Button
              className="mt-6"
              onClick={() => router.navigate({ to: '/marketplace/create' })}
              style={{ minHeight: 48 }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Publier votre première offre
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {offers.map((offer: any) => (
              <Card key={offer.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-2">
                      {/* Status + Date */}
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariants[offer.status] || 'outline'}>
                          {statusLabels[offer.status] || offer.status}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(offer.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold text-foreground">{offer.title}</h3>

                      {/* Description */}
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {offer.description}
                      </p>

                      {/* Price + Quantity */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-bold text-primary">
                          {Number(offer.price)?.toLocaleString('fr-FR')} FCFA / {offer.unit}
                        </span>
                        <span className="text-muted-foreground">
                          Qté: {offer.quantity}
                        </span>
                        {offer.location && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {offer.location}
                          </span>
                        )}
                      </div>

                      {/* Views + Contacts */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {offer.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" /> {offer.contacts || 0}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.navigate({
                          to: '/marketplace/$id/edit',
                          params: { id: offer.id },
                        })}
                        style={{ minHeight: 44, minWidth: 44 }}
                        aria-label={`Modifier ${offer.title}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(offer.id, offer.title)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        style={{ minHeight: 44, minWidth: 44 }}
                        aria-label={`Supprimer ${offer.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
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