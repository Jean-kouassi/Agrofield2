import { MapPin, Edit3, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CategoryBadge } from './category-badge'
import { StatusBadge } from './status-badge'
import { StarRating } from './stars'
import type { MarketplaceListing } from '@/lib/marketplace-data'
import { fcfa, productImage } from '@/lib/marketplace-data'

interface ProductCardProps {
  listing: MarketplaceListing
  onSelect: (listing: MarketplaceListing, order?: boolean) => void
  mine?: boolean
  onEdit?: (listing: MarketplaceListing) => void
  onDelete?: (listing: MarketplaceListing) => void
}

export function ProductCard({
  listing,
  onSelect,
  mine = false,
  onEdit,
  onDelete,
}: ProductCardProps) {
  // Utiliser la première image du listing ou une image par défaut
  const images = listing.images || [];
  console.log('[ProductCard] Listing:', listing.id, 'Images:', images);
  
  // Gérer les anciens formats d'URL (agrofield-media) et nouveaux (marketplace-images)
  let imageUrl = `https://picsum.photos/seed/AgroSphere-${listing.id}/640/480`;
  
  if (images.length > 0 && images[0]) {
    const firstImage = images[0];
    // Si c'est une URL complète, l'utiliser directement
    if (firstImage.startsWith('http')) {
      imageUrl = firstImage;
    } else {
      // Sinon construire l'URL (cas théorique, normalement on stocke des URLs complètes)
      imageUrl = firstImage;
    }
  }
  
  console.log('[ProductCard] Using imageUrl:', imageUrl);
  return (
    <Card
      className="af-card rounded-2xl overflow-hidden cursor-pointer flex flex-col"
      onClick={() => onSelect(listing)}
    >
      <div className="relative af-aspect-43 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            console.error('[ProductCard] Image failed to load:', imageUrl);
            // Fallback si l'image échoue
            e.currentTarget.src = `https://picsum.photos/seed/AgroSphere-${listing.id}/640/480`
          }}
        />
        <div className="absolute top-2 left-2">
          <CategoryBadge category={listing.category} />
        </div>
        <div className="absolute top-2 right-2">
          <StatusBadge status={listing.status} />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="af-display font-semibold af-text-15 leading-snug af-clamp-2">
          {listing.title}
        </h3>
        <p className="text-sm af-clamp-2 text-muted-foreground">{listing.desc}</p>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="af-display text-lg font-extrabold text-primary">
            {fcfa(listing.price)}
          </span>
          <span className="text-xs text-muted-foreground">/{listing.unit}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {listing.city}, {listing.region}
          </span>
          <span>{listing.qty} {listing.unit} dispo.</span>
        </div>

        <div className="text-xs text-muted-foreground">
          Vendeur :{' '}
          <span className="font-medium text-foreground">{listing.seller}</span>
        </div>

        {mine ? (
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(listing)
              }}
              className="af-btn-ghost flex-1 rounded-lg text-sm font-semibold h-11"
            >
              <Edit3 size={15} /> Modifier
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(listing)
              }}
              className="rounded-lg text-sm font-semibold h-11 px-3"
              style={{ background: '#fee2e2', color: 'var(--agro-danger)' }}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onSelect(listing, true)
            }}
            disabled={listing.status !== 'available'}
            className="af-btn-primary rounded-lg text-sm font-semibold mt-2 h-12"
          >
            {listing.status === 'available'
              ? 'Commander'
              : listing.status === 'reserved'
              ? 'Réservé'
              : 'Épuisé'}
          </Button>
        )}
      </div>
    </Card>
  )
}

export function ProductSkeleton() {
  return (
    <Card className="af-card rounded-2xl overflow-hidden">
      <div className="af-skeleton af-aspect-43" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="af-skeleton h-4 w-3/4 rounded" />
        <div className="af-skeleton h-3 w-full rounded" />
        <div className="af-skeleton h-3 w-1/2 rounded" />
        <div className="af-skeleton h-9 w-full rounded-lg mt-2" />
      </div>
    </Card>
  )
}

interface EmptyStateProps {
  onReset: () => void
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--agro-light)' }}
      >
        <span className="text-3xl">🌱</span>
      </div>
      <h3 className="af-display font-bold text-lg">Aucune offre ne correspond</h3>
      <p className="text-sm mt-1 max-w-xs text-muted-foreground">
        Essayez d'élargir votre recherche ou de réinitialiser les filtres.
      </p>
      <Button
        variant="outline"
        onClick={onReset}
        className="af-btn-ghost rounded-lg px-4 py-2.5 text-sm font-semibold mt-4"
      >
        Réinitialiser les filtres
      </Button>
    </div>
  )
}
