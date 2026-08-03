import { createFileRoute, useRouter, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MapPin, Phone, ShoppingCart, Share2, Heart } from 'lucide-react'
import { getOffer, createOrder } from '@/lib/marketplace'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { Offer, Order } from '@/types/marketplace'

export const Route = createFileRoute('/marketplace/$id')({
  component: OfferDetailPage,
})

function OfferDetailPage() {
  const router = useRouter()
  const { id } = useParams({ from: '/marketplace/$id' })
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    loadOffer()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [id])

  async function loadOffer() {
    try {
      setLoading(true)
      const data = await getOffer(id)
      setOffer(data)
    } catch (error) {
      console.error('Failed to load offer:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleOrder() {
    if (!offer) return

    if (!user) {
      toast.error('Vous devez être connecté pour commander')
      router.navigate({ to: '/auth' })
      return
    }

    setOrdering(true)
    try {
      const buyerId = user.id
      const buyerName = user.email || user.user_metadata?.full_name || 'Acheteur'

      const orderData = {
        offer_id: offer.id,
        buyer_id: user.id,
        seller_id: offer.sellerId,
        quantity,
        total_price: offer.price * quantity,
        payment_method: 'cash',
        status: 'pending',
        notes: undefined,
      }

      await createOrder(orderData)
      toast.success('✅ Commande créée avec succès ! Le vendeur vous contactera bientôt.')
      router.navigate({ to: '/marketplace/orders' })
    } catch (error: any) {
      console.error('Failed to create order:', error)
      toast.error('❌ Erreur: ' + (error?.message || 'Vérifiez votre connexion.'))
    } finally {
      setOrdering(false)
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: offer?.title || 'Offre AgroField',
        text: offer?.description || '',
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié dans le presse-papier !')
    }
  }

  function handleFavorite() {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris ❤️')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">Offre non trouvée</p>
          <Button className="mt-4" onClick={() => router.navigate({ to: '/marketplace' })}>
            Retour au marketplace
          </Button>
        </Card>
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
            Retour
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-white hover:bg-green-700"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              className="text-white hover:bg-green-700"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 max-w-3xl">
        {/* Product Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Badge className="mb-2 capitalize">{offer.category}</Badge>
                <CardTitle className="text-2xl">{offer.title}</CardTitle>
              </div>
              <Badge className={
                offer.status === 'available' ? 'bg-green-600' : 'bg-gray-500'
              }>
                {offer.status === 'available' ? 'Disponible' : offer.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price */}
            <div>
              <p className="text-4xl font-bold text-green-600">
                {offer.price.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-sm text-gray-500">
                par {offer.unit} • {offer.quantity} {offer.unit}s disponibles
              </p>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {offer.description}
              </p>
            </div>

            {/* Location */}
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{offer.location}, {offer.region}</span>
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Vendeur</h3>
              <p className="text-gray-700">{offer.sellerName}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span className="mr-4">👁️ {offer.views} vues</span>
                <span>💬 {offer.contacts} contacts</span>
              </div>
            </div>

            {/* Dates */}
            <div className="text-sm text-gray-500">
              <p>Publié le: {new Date(offer.createdAt).toLocaleDateString('fr-FR')}</p>
              <p>Expire le: {new Date(offer.expiresAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle>Commander</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantité ({offer.unit})</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12"
                >
                  -
                </Button>
                <span className="text-2xl font-bold w-20 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(offer.quantity, quantity + 1))}
                  className="w-12 h-12"
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Maximum: {offer.quantity} {offer.unit}s
              </p>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold text-green-600">
                  {(offer.price * quantity).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {/* Order Button */}
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleOrder}
                disabled={ordering || offer.status !== 'available'}
              >
                {ordering ? (
                  'Traitement en cours...'
                ) : offer.status !== 'available' ? (
                  'Indisponible'
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6 mr-2" />
                    Commander maintenant
                  </>
                )}
              </Button>

              {/* Contact Seller */}
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg mt-3"
              >
                <Phone className="w-6 h-6 mr-2" />
                Contacter le vendeur
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Le vendeur vous contactera pour confirmer la commande
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}