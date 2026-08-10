import { cn } from '@/lib/utils'
import type { ListingStatus } from '@/lib/marketplace-data'

interface StatusBadgeProps {
  status: ListingStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<ListingStatus, { cls: string; label: string }> = {
    available: { cls: 'af-badge-available', label: 'Disponible' },
    reserved: { cls: 'af-badge-reserved', label: 'Réservé' },
    sold: { cls: 'af-badge-sold', label: 'Épuisé' },
    draft: { cls: 'af-badge-draft', label: 'Brouillon' },
  }
  const m = map[status] || map.available

  return (
    <span
      className={cn(
        'af-display text-xs font-semibold px-2.5 py-1 rounded-full',
        m.cls
      )}
    >
      {m.label}
    </span>
  )
}
