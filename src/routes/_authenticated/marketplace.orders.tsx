import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Package, ShoppingBag, Clock, CheckCircle2, XCircle, Calendar,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/marketplace/orders')({
  ssr: false,
  component: OrdersPage,
})

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  processing: 'En cours',
  completed: 'Terminee',
  cancelled: 'Annulee',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  completed: 'outline',
  cancelled: 'destructive',
}

const paymentLabels: Record<string, string> = {
  cash: 'Cash',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  virement: 'Virement',
}

interface Order {
  id: string
  offer_id: string
  buyer_id: string
  seller_id: string
  quantity: number
  total_price: number
  payment_method: string
  status: string
  notes?: string | null
  created_at: string
}

function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'buyer' | 'seller'>('buyer')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (!data.user) {
        toast.error('Connectez-vous pour voir vos commandes')
        router.navigate({ to: '/auth' })
        return
      }
      loadOrders(data.user.id)
    })
  }, [router])

  async function loadOrders(userId: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err: any) {
      console.error('Failed to load orders:', err)
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId: string, status: string) {
    const updates: Record<string, any> = { status }
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString()
    if (status === 'completed') updates.completed_at = new Date().toISOString()
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString()

    try {
      const { error } = await supabase.from('orders').update(updates as any).eq('id', orderId)
      if (error) throw error
      toast.success('Statut mis a jour')
      if (user) loadOrders(user.id)
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-32 w-64" />
      </div>
    )
  }

  const buyerOrders = orders.filter((o) => o.buyer_id === user.id)
  const sellerOrders = orders.filter((o) => o.seller_id === user.id)
  const displayOrders = tab === 'buyer' ? buyerOrders : sellerOrders

  return (
    <div className="min-h-screen bg-background">
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
            Commandes
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto max-w-3xl space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab('buyer')}
            className={'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ' + (tab === 'buyer' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
            style={{ minHeight: 48 }}
            aria-pressed={tab === 'buyer'}
          >
            <ShoppingBag className="h-4 w-4" />
            Mes achats ({buyerOrders.length})
          </button>
          <button
            onClick={() => setTab('seller')}
            className={'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ' + (tab === 'seller' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
            style={{ minHeight: 48 }}
            aria-pressed={tab === 'seller'}
          >
            <Package className="h-4 w-4" />
            Mes ventes ({sellerOrders.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 w-fit rounded-full bg-muted p-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">
              {tab === 'buyer' ? 'Aucune commande' : 'Aucune vente'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === 'buyer' ? 'Vos achats apparaitront ici' : 'Vos ventes apparaitront ici'}
            </p>
            <Button
              className="mt-6"
              onClick={() => router.navigate({ to: '/marketplace' })}
              style={{ minHeight: 48 }}
            >
              Aller au marketplace
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((order) => {
              const isSeller = tab === 'seller'
              return (
                <Card key={order.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={statusVariants[order.status] || 'outline'} className="text-[10px]">
                        <Clock className="mr-1 h-3 w-3" />
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantite</p>
                        <p className="font-semibold text-foreground">{order.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold text-primary">
                          {Number(order.total_price).toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paiement</p>
                        <p className="font-medium text-foreground">
                          {paymentLabels[order.payment_method] || order.payment_method}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="font-medium text-foreground">
                          {isSeller ? 'Vendeur' : 'Acheteur'}
                        </p>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-2 rounded-md bg-muted/50 px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">{order.notes}</p>
                      </div>
                    )}

                    {isSeller && order.status === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          style={{ minHeight: 44 }}
                          onClick={() => updateStatus(order.id, 'confirmed')}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-destructive hover:bg-destructive/10"
                          style={{ minHeight: 44 }}
                          onClick={() => updateStatus(order.id, 'cancelled')}
                        >
                          <XCircle className="mr-1 h-4 w-4" /> Refuser
                        </Button>
                      </div>
                    )}

                    {isSeller && order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        style={{ minHeight: 44 }}
                        onClick={() => updateStatus(order.id, 'completed')}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Marquer comme terminee
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}