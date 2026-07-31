/**
 * AgroConnect - Offer Card Component
 * Carte produit réutilisable pour le marketplace
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ShoppingCart } from 'lucide-react'
import type { Offer } from '@/types/marketplace'
import { useRouter } from '@tanstack/react-router'

interface OfferCardProps {
  offer: Offer
  onClick?: () => void
}

export function OfferCard({ offer, onClick }: OfferCardProps) {
  const router = useRouter()

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

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick || (() => router.navigate({ to: '/marketplace/$id', params: { id: offer.id } }))}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">
              {offer.title}
            </CardTitle>
            <Badge variant="secondary" className="capitalize">
              {offer.category}
            </Badge>
          </div>
          <Badge className={statusColors[offer.status] || 'bg-gray-500'}>
            {statusLabels[offer.status] || offer.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {offer.description}
        </p>
        
        {/* Price & Quantity */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {offer.price.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-gray-500">
              par {offer.unit} • {offer.quantity} {offer.unit}s dispo
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{offer.location}, {offer.region}</span>
        </div>

        {/* Actions */}
        <div className="pt-3 flex gap-2">
          <Button 
            className="flex-1 h-12 text-base"
            onClick={(e) => {
              e.stopPropagation()
              router.navigate({ to: '/marketplace/$id', params: { id: offer.id } })
            }}
          >
            Commander
          </Button>
          <Button 
            variant="outline" 
            className="h-12 w-12 p-0"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Add to cart
            }}
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>

        {/* Seller Info */}
        <p className="text-xs text-gray-400 pt-2">
          Vendeur: {offer.sellerName}
        </p>

        {/* Stats */}
        <div className="flex items-center text-xs text-gray-400 gap-3">
          <span>👁️ {offer.views} vues</span>
          <span>💬 {offer.contacts} contacts</span>
        </div>
      </CardContent>
    </Card>
  )
}
