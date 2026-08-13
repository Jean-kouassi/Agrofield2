import { useUserRole } from '@/lib/roles'
import { Wallet, TrendingUp, TrendingDown, Package, ShoppingCart } from 'lucide-react'
import { formatFcfa } from '@/lib/agrosphere'

interface SimpleFinanceProps {
  role: 'wholesaler' | 'retailer'
}

export function SimpleFinance({ role }: SimpleFinanceProps) {
  const isWholesaler = role === 'wholesaler'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">
          {isWholesaler ? 'Finances — Grossiste' : 'Finances — Détaillant'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isWholesaler 
            ? 'Suivez vos achats en gros et vos reventes'
            : 'Gérez vos achats et ventes au détail'}
        </p>
      </div>

      {/* Stats simplifiées */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Achats"
          value={formatFcfa(0)}
          icon={<TrendingDown className="h-4 w-4" />}
          tone="warn"
        />
        <StatCard
          label="Ventes"
          value={formatFcfa(0)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="ok"
        />
        <StatCard
          label="Marge"
          value={formatFcfa(0)}
          icon={<Wallet className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Commandes"
          value="0"
          icon={<Package className="h-4 w-4" />}
          tone="muted"
        />
      </div>

      {/* Message d'information */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="text-lg font-bold mb-2">Historique des transactions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Vos achats et ventes sur la marketplace apparaîtront ici automatiquement.
        </p>
        <p className="text-xs text-muted-foreground">
          Cette vue simplifiée est adaptée à votre profil {isWholesaler ? 'grossiste' : 'détaillant'}.
        </p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 rounded-2xl bg-primary p-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          <ShoppingCart className="h-4 w-4" />
          Nouvel achat
        </button>
        <button className="flex items-center justify-center gap-2 rounded-2xl bg-accent p-4 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90">
          <TrendingUp className="h-4 w-4" />
          Nouvelle vente
        </button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'primary' | 'ok' | 'warn' | 'muted'
}) {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary text-primary-foreground'
      : tone === 'ok'
        ? 'bg-secondary text-secondary-foreground'
        : tone === 'warn'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-card text-card-foreground border border-border'
  
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {icon} {label}
      </div>
      <div className="mt-1 text-xl font-black tracking-tight">{value}</div>
    </div>
  )
}
