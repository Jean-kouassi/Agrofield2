import { createFileRoute, useRouter, useParams } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, MapPin, Phone, ShoppingCart, Share2, Heart,
  Eye, MessageCircle, Calendar, Package, Truck, Store,
  Minus, Plus, ChevronRight, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { getOffer, updateOffer, createOrder } from '@/lib/marketplace'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { Offer, PaymentMethod, UnitType } from '@/types/marketplace'

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
  const [selectedImage, setSelectedImage] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [isOwnOffer, setIsOwnOffer] = useState(false)

  useEffect(() => {
    loadOffer()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user && offer?.sellerId === data.user.id) {
        setIsOwnOffer(true)
      }
    })
  }, [id])

  // Incrémenter les vues une seule fois
  const incrementViews = useCallback(async (offerId: string, currentViews: number) => {
    try {
      await updateOffer(offerId, { views: currentViews + 1 } as any)
    } catch {
      // Silent fail - non critique
    }
  }, [])

  async function loadOffer() {
    try {
      setLoading(true)
      const data = await getOffer(id)
      setOffer(data)
      if (data) {
        incrementViews(data.id, data.views)
        // Charger les favoris depuis localStorage
        const favorites = JSON.parse(localStorage.getItem('marketplace_favorites') || '[]')
        setIsFavorite(favorites.includes(data.id))
      }
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

    if (isOwnOffer) {
      toast.error('Vous ne pouvez pas commander votre propre offre')
      return
    }

    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Veuillez renseigner l\'adresse de livraison')
      return
    }

    setOrdering(true)
    try {
      const orderData = {
        offer_id: offer.id,
        buyer_id: user.id,
        seller_id: offer.sellerId,
        quantity,
        total_price: offer.price * quantity,
        payment_method: paymentMethod,
        status: 'pending',
        notes: notes || undefined,
      }

      await createOrder(orderData)
      toast.success('✅ Commande créée ! Le vendeur vous contactera bientôt.')
      router.navigate({ to: '/marketplace/orders' })
    } catch (error: any) {
      console.error('Failed to create order:', error)
      toast.error('❌ Erreur: ' + (error?.message || 'Vérifiez votre connexion.'))
    } finally {
      setOrdering(false)
    }
  }

  async function handleShare() {
    const shareData = {
      title: offer?.title || 'Offre AgroSphere',
      text: `${offer?.title} - ${offer?.price.toLocaleString('fr-FR')} FCFA sur AgroSphere`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié dans le presse-papier !')
    }
  }

  function handleFavorite() {
    if (!offer) return
    const favorites = JSON.parse(localStorage.getItem('marketplace_favorites') || '[]')
    let newFavorites: string[]

    if (isFavorite) {
      newFavorites = favorites.filter((f: string) => f !== offer.id)
      toast.success('Retiré des favoris')
    } else {
      newFavorites = [...favorites, offer.id]
      toast.success('Ajouté aux favoris ❤️')
    }

    localStorage.setItem('marketplace_favorites', JSON.stringify(newFavorites))
    setIsFavorite(!isFavorite)
  }

  function handleContactSeller() {
    if (!user) {
      toast.error('Connectez-vous pour contacter le vendeur')
      router.navigate({ to: '/auth' })
      return
    }
    // Naviguer vers la messagerie avec le vendeur
    router.navigate({ to: '/marketplace/messages' })
  }

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Not Found ───
  if (!offer) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <p className="text-lg font-medium text-foreground">Offre non trouvée</p>
          <p className="mt-1 text-sm text-muted-foreground">Cette offre a peut-être été supprimée ou expirée.</p>
          <Button
            className="mt-6"
            onClick={() => router.navigate({ to: '/marketplace' })}
            style={{ minHeight: 48 }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au marketplace
          </Button>
        </Card>
      </div>
    )
  }

  const totalPrice = offer.price * quantity
  const isExpired = new Date(offer.expiresAt) < new Date()
  const isAvailable = offer.status === 'available' && !isExpired

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: '/marketplace' })}
            className="font-medium"
            style={{ minHeight: 48 }}
            aria-label="Retour au marketplace"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              style={{ minHeight: 48, minWidth: 48 }}
              aria-label="Partager cette offre"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              style={{ minHeight: 48, minWidth: 48 }}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-destructive text-destructive' : 'text-foreground'}`}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="container mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* Image Gallery */}
        {offer.images.length > 0 && (
          <div className="space-y-2">
            {/* Main image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
              <img
                src={offer.images[selectedImage]}
                alt={`${offer.title} - image ${selectedImage + 1}`}
                className="h-full w-full object-cover"
                loading="eager"
              />
              {offer.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((selectedImage - 1 + offer.images.length) % offer.images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ minHeight: 44, minWidth: 44 }}
                    aria-label="Image précédente"
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((selectedImage + 1) % offer.images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ minHeight: 44, minWidth: 44 }}
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {offer.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin" data-swipe-ignore>
                {offer.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      i === selectedImage ? 'border-primary' : 'border-border'
                    }`}
                    aria-label={`Voir image ${i + 1}`}
                    aria-pressed={i === selectedImage}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2 capitalize">{offer.category}</Badge>
                <CardTitle className="text-xl sm:text-2xl">{offer.title}</CardTitle>
              </div>
              <Badge variant={isAvailable ? 'default' : 'destructive'}>
                {isAvailable ? 'Disponible' : isExpired ? 'Expirée' : offer.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Price + Quantity */}
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {offer.price.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  par {offer.unit} • {offer.quantity} {offer.unit}s disponibles
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {(offer.price * offer.quantity).toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-muted-foreground">valeur totale</p>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Description</h3>
              <p className="whitespace-pre-line text-foreground">
                {offer.description}
              </p>
            </div>

            <Separator />

            {/* Location + Dates */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">{offer.location}</p>
                  <p className="text-xs text-muted-foreground">{offer.region}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Publié: {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expire: {new Date(offer.expiresAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seller Info */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Vendeur</h3>
              <p className="font-medium text-foreground">{offer.sellerName}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {offer.views} vues
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> {offer.contacts} contacts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Order Form (collapsible) ─── */}
        {!isOwnOffer && (
          <Card>
            <CardHeader>
              <button
                onClick={() => setShowOrderForm(!showOrderForm)}
                className="flex w-full items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
                style={{ minHeight: 48 }}
                aria-expanded={showOrderForm}
                aria-controls="order-form"
              >
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Commander
                </CardTitle>
                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showOrderForm ? 'rotate-90' : ''}`} />
              </button>
            </CardHeader>

            {showOrderForm && (
              <CardContent id="order-form" className="space-y-5">
                {/* Quantity Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="quantity">
                    Quantité ({offer.unit})
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      style={{ minHeight: 48, minWidth: 48 }}
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="min-w-[60px] text-center text-2xl font-bold text-foreground">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(offer.quantity, quantity + 1))}
                      disabled={quantity >= offer.quantity}
                      style={{ minHeight: 48, minWidth: 48 }}
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum: {offer.quantity} {offer.unit}s
                  </p>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mode de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'cash', label: 'Cash', icon: Store },
                      { value: 'orange_money', label: 'Orange Money', icon: Phone },
                      { value: 'moov_money', label: 'Moov Money', icon: Phone },
                      { value: 'virement', label: 'Virement', icon: Package },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setPaymentMethod(value as PaymentMethod)}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                          paymentMethod === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                        style={{ minHeight: 48 }}
                        aria-pressed={paymentMethod === value}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mode de récupération</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                        deliveryMethod === 'pickup'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                      style={{ minHeight: 48 }}
                      aria-pressed={deliveryMethod === 'pickup'}
                    >
                      <Store className="h-4 w-4" />
                      Sur place
                    </button>
                    <button
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                        deliveryMethod === 'delivery'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                      style={{ minHeight: 48 }}
                      aria-pressed={deliveryMethod === 'delivery'}
                    >
                      <Truck className="h-4 w-4" />
                      Livraison
                    </button>
                  </div>
                </div>

                {/* Delivery Address (if delivery selected) */}
                {deliveryMethod === 'delivery' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="delivery-address">
                      Adresse de livraison
                    </label>
                    <textarea
                      id="delivery-address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Quartier, rue, point de repère..."
                      className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="order-notes">
                    Notes (optionnel)
                  </label>
                  <textarea
                    id="order-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Précisions sur votre commande..."
                    className="min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Total + Order Button */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-base font-medium text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {totalPrice.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    style={{ minHeight: 56 }}
                    onClick={handleOrder}
                    disabled={ordering || !isAvailable}
                  >
                    {ordering ? (
                      'Traitement en cours...'
                    ) : !isAvailable ? (
                      'Indisponible'
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Commander {quantity} {offer.unit}(s)
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Le vendeur vous contactera pour confirmer la commande
                </p>
              </CardContent>
            )}

            {/* Quick actions (always visible) */}
            {!showOrderForm && (
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => setShowOrderForm(true)}
                    disabled={!isAvailable}
                    style={{ minHeight: 56 }}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isAvailable ? 'Commander' : 'Indisponible'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleContactSeller}
                    style={{ minHeight: 56 }}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contacter le vendeur
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* ─── Own Offer Actions ─── */}
        {isOwnOffer && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">C'est votre offre</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.navigate({ to: '/marketplace/$id/edit', params: { id: offer.id } })}
                  style={{ minHeight: 48 }}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.navigate({ to: '/marketplace/my-offers' })}
                  style={{ minHeight: 48 }}
                >
                  Mes offres
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}