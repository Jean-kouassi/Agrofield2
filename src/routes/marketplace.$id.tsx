import { createFileRoute, useRouter, useParams, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MapPin, Phone, ShoppingCart, Share2, Heart, Calendar, User } from 'lucide-react'
import { getOffer, createOrder } from '@/lib/marketplace'
import type { Offer, Order } from '@/types/marketplace'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'orange_money' | 'moov_money' | 'virement'>('cash')

  useEffect(() => {
    loadOffer()
  }, [id])

  async function loadOffer() {
    try {
      setLoading(true)
      const data = await getOffer(id)
      setOffer(data)
    } catch (error) {
      console.error('Failed to load offer:', error)
      toast.error('Impossible de charger l\'offre')
    } finally {
      setLoading(false)
    }
  }

  async function handleOrder() {
    if (!offer) return
    
    // Vérifier authentification
    const { data: { user } } = await supabase.auth.getSession()
    if (!user) {
      toast.error('Veuillez vous connecter pour passer une commande')
      router.navigate({ to: '/auth' })
      return
    }

    setOrdering(true)
    try {
      const order: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        offer_id: offer.id,
        buyer_id: user.id,
        quantity,
        total_price: offer.price * quantity,
        payment_method: paymentMethod,
        status: 'pending',
      }

      await createOrder(order)
      toast.success('✅ Commande créée avec succès ! Le vendeur vous contactera bientôt.')
      router.navigate({ to: '/marketplace' })
    } catch (error) {
      console.error('Failed to create order:', error)
      toast.error('❌ Erreur lors de la commande')
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
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Offre non trouvée</h2>
          <p className="text-gray-500 mb-6">Cette offre n'existe plus ou a été supprimée.</p>
          <Link to="/marketplace">
            <Button className="bg-green-600 hover:bg-green-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au marketplace
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const totalPrice = offer.price * quantity

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: '/marketplace' })}
            className="text-white hover:bg-green-700/50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-white hover:bg-green-700/50"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-green-700/50"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Colonne Gauche - Détails */}
          <div className="md:col-span-2 space-y-6">
            {/* Carte Principale */}
            <Card className="border-2 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 h-64 flex items-center justify-center">
                <Leaf className="w-32 h-32 text-green-300 opacity-50" />
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2 bg-green-100 text-green-800 border-green-200">
                      {offer.category}
                    </Badge>
                    <CardTitle className="text-3xl font-black">{offer.title}</CardTitle>
                  </div>
                  <Badge className={
                    offer.status === 'active' ? 'bg-green-500' : 
                    offer.status === 'sold' ? 'bg-red-500' : 'bg-gray-400'
                  }>
                    {offer.status === 'active' ? 'Disponible' : 
                     offer.status === 'sold' ? 'Vendu' : 'Inactif'}
                  </Badge>
                </div>
                
                {offer.region && (
                  <div className="flex items-center gap-2 text-gray-600 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{offer.location || ''} {offer.location && '-'} {offer.region}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{offer.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <InfoBox
                    icon={<ShoppingCart className="w-5 h-5" />}
                    label="Prix"
                    value={`${offer.price.toLocaleString('fr-FR')} FCFA/${offer.unit}`}
                  />
                  <InfoBox
                    icon={<Calendar className="w-5 h-5" />}
                    label="Quantité"
                    value={`${offer.quantity} ${offer.unit}`}
                  />
                </div>

                {offer.payment_methods && offer.payment_methods.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-lg mb-2">Moyens de paiement acceptés</h3>
                    <div className="flex flex-wrap gap-2">
                      {offer.payment_methods.map((method) => (
                        <Badge key={method} variant="outline" className="text-sm">
                          {method === 'cash' && '💵 Espèces'}
                          {method === 'orange_money' && '🟠 Orange Money'}
                          {method === 'moov_money' && '🔵 Moov Money'}
                          {method === 'virement' && '🏦 Virement'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne Droite - Formulaire de Commande */}
          <div className="space-y-6">
            <Card className="border-2 shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  Passer une commande
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Quantité */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantité ({offer.unit})</label>
                  <Input
                    type="number"
                    min="1"
                    max={offer.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-12 text-lg"
                  />
                  <p className="text-xs text-gray-500">
                    Disponible: {offer.quantity} {offer.unit}
                  </p>
                </div>

                {/* Moyen de paiement */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Moyen de paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full h-12 px-3 border rounded-md"
                  >
                    <option value="cash">💵 Espèces</option>
                    <option value="orange_money">🟠 Orange Money</option>
                    <option value="moov_money">🔵 Moov Money</option>
                    <option value="virement">🏦 Virement bancaire</option>
                  </select>
                </div>

                {/* Total */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Prix unitaire:</span>
                    <span className="font-medium">{offer.price.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantité:</span>
                    <span className="font-medium">{quantity} {offer.unit}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-green-600 pt-2 border-t">
                    <span>Total:</span>
                    <span>{totalPrice.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                {/* Bouton Commander */}
                <Button
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  onClick={handleOrder}
                  disabled={ordering || offer.status !== 'active'}
                >
                  {ordering ? 'Traitement...' : 
                   offer.status !== 'active' ? 'Indisponible' : 
                   'Commander maintenant'}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Le vendeur vous contactera après confirmation
                </p>
              </CardContent>
            </Card>

            {/* Info Sécurité */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Conseil de sécurité</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Privilégiez les rencontres dans des lieux publics pour finaliser la transaction.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-green-600">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  )
}

// Import manquant (DÉJÀ IMPORTÉ EN HAUT - NE PAS SUPPRIMER)
// import { Leaf } from 'lucide-react'
