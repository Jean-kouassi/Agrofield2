import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace-data'
import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  category: string
  variant?: 'solid' | 'outline'
}

export function CategoryBadge({ category, variant = 'outline' }: CategoryBadgeProps) {
  const c = MARKETPLACE_CATEGORIES.find((x) => x.id === category)
  if (!c) return null
  const Icon = c.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
        variant === 'solid' && 'bg-white/90'
      )}
      style={{
        color: c.color,
        border: `1px solid ${c.color}33`,
      }}
    >
      <Icon size={12} /> {c.label}
    </span>
  )
}
