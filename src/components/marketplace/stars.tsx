import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: number
}

export function StarRating({ rating, size = 13 }: StarRatingProps) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs"
      style={{ color: 'var(--agro-accent)' }}
    >
      <Star size={size} fill="var(--agro-accent)" strokeWidth={0} />
      {rating.toFixed(1)}
    </span>
  )
}
