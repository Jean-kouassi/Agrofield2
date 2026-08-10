import { TrendingUp, TrendingDown } from 'lucide-react'
import { TICKER, fcfa } from '@/lib/marketplace-data'

export function PriceTicker() {
  const doubled = [...TICKER, ...TICKER]

  return (
    <div
      className="af-scrollbar-hide overflow-hidden border-y"
      style={{
        borderColor: 'var(--agro-border)',
        background: 'var(--agro-primary-dark)',
      }}
    >
      <div className="af-ticker-track py-2">
        {doubled.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-5 text-sm text-white/90 shrink-0"
          >
            <span className="font-semibold af-display">{t.name}</span>
            <span>{fcfa(t.price)}/{t.unit}</span>
            {t.trend === 'up' ? (
              <TrendingUp size={14} className="text-emerald-300" />
            ) : (
              <TrendingDown size={14} className="text-red-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
