import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ShoppingBag, Package, CheckCircle, XCircle, Clock } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { Order } from '@/types/marketplace'
import type { MarketplaceListing } from '@/lib/marketplace-data'
import { EditOfferModal } from '@/components/marketplace/edit-offer-modal'
import { DebugOrders } from '@/components/marketplace/debug-orders'

export const Route = createFileRoute('/_authenticated/marketplace/orders')({
  ssr: false,
  component: OrdersPage,
})

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500', icon: <CheckCircle className="w-4 h-4" /> },
  processing: { label: 'En cours', color: 'bg-purple-500', icon: <Clock className="w-4 h-4" /> },
  completed: { label: 'Terminée', color: 'bg-green-600', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Annulée', color: 'bg-red-500', icon: <XCircle className="w-4 h-4" /> },
}

function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'buyer' | 'seller'>('buyer')
  const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (!data.user) {
        toast.error('Vous devez être connecté')
        router.navigate({ to: '/auth' })
        return
      }
      loadOrders(data.user.id)
    })
  }, [])

  async function loadOrders(userId: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data || []) as unknown as Order[])
    } catch (err: any) {
      console.error('Failed to load orders:', err)
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }

  const buyerOrders = orders.filter(o => o.buyerId === user?.id)
  const sellerOrders = orders.filter(o => o.sellerId === user?.id)
  const displayedOrders = tab === 'buyer' ? buyerOrders : sellerOrders

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
            <ShoppingBag className="w-5 h-5" />
            Mes commandes
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-4xl">
        {/* Debug Component - À supprimer après fix */}
        <DebugOrders />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === 'buyer' ? 'default' : 'outline'}
            onClick={() => setTab('buyer')}
            className={tab === 'buyer' ? 'bg-green-600' : ''}
          >
            <Package className="w-4 h-4 mr-2" />
            Mes achats ({buyerOrders.length})
          </Button>
          <Button
            variant={tab === 'seller' ? 'default' : 'outline'}
            onClick={() => setTab('seller')}
            className={tab === 'seller' ? 'bg-green-600' : ''}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Mes ventes ({sellerOrders.length})
          </Button>
        </div>

        {/* Orders list */}
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
        ) : displayedOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {tab === 'buyer' ? 'Aucun achat' : 'Aucune vente'}
            </h3>
            <p className="text-gray-500 mb-4">
              {tab === 'buyer'
                ? 'Vous n\'avez pas encore passé de commande.'
                : 'Personne n\'a encore commandé vos produits.'}
            </p>
            <Button
              onClick={() => router.navigate({ to: '/marketplace' })}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Parcourir le marketplace
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">
                          {tab === 'buyer' ? (order as any).seller_name || 'Vendeur' : (order as any).buyer_name || 'Acheteur'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge className={`${status.color} text-white`}>
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Quantité</p>
                        <p className="font-medium">{order.quantity} {order.unit}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Prix unitaire</p>
                        <p className="font-medium">{order.unitPrice.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total</p>
                        <p className="font-bold text-green-600">
                          {order.totalPrice.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Paiement</p>
                        <p className="font-medium capitalize">{order.paymentMethod}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {tab === 'seller' && order.status === 'pending' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('orders')
                                .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
                                .eq('id', order.id)
                              if (error) throw error
                              toast.success('✅ Commande confirmée')
                              loadOrders(user.id)
                            } catch (err: any) {
                              toast.error('Erreur: ' + err.message)
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (!confirm('Annuler cette commande ?')) return
                            try {
                              const { error } = await supabase
                                .from('orders')
                                .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
                                .eq('id', order.id)
                              if (error) throw error
                              toast.success('Commande annulée')
                              loadOrders(user.id)
                            } catch (err: any) {
                              toast.error('Erreur: ' + err.message)
                            }
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                      </div>
                    )}

                    {tab === 'seller' && order.status === 'confirmed' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('orders')
                                .update({ status: 'completed', completed_at: new Date().toISOString() })
                                .eq('id', order.id)
                              if (error) throw error
                              toast.success('✅ Vente terminée')
                              loadOrders(user.id)
                            } catch (err: any) {
                              toast.error('Erreur: ' + err.message)
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Marquer comme livré
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal d'édition des offres */}
      <EditOfferModal
        listing={editingListing}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          setEditingListing(null)
          // Recharger les données si nécessaire
        }}
      />
    </div>
  )
}