import { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  Heart,
  MapPin,
  ChevronRight,
  Package,
  Repeat,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { fcfa, type MarketplaceListing } from '@/lib/marketplace-data'
import {
  fetchBuyerStats,
  fetchMyBuyOrders,
  fetchListings,
  type BuyerStats,
} from '@/lib/marketplace-service'
import { ProductCard } from './product-card'

// ============================================================
// BUYER DASHBOARD — Tableau de bord de l'acheteur
// ============================================================

interface BuyerDashboardProps {
  onBrowse: () => void
  onSelectProduct: (listing: MarketplaceListing) => void
}

export function BuyerDashboard({ onBrowse, onSelectProduct }: BuyerDashboardProps) {
  const [stats, setStats] = useState<BuyerStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recommended, setRecommended] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [buyerStats, orders, listings] = await Promise.all([
          fetchBuyerStats().catch(() => null),
          fetchMyBuyOrders().catch(() => []),
          fetchListings().catch(() => []),
        ])

        setStats(buyerStats)
        setRecentOrders(orders.slice(0, 4))
        // Recommandations: offres disponibles triées par plus récentes
        setRecommended(
          listings
            .filter((l) => l.status === 'available')
            .slice(0, 6)
        )
      } catch (error) {
        console.error('Error loading buyer dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <p className="text-sm text-center py-10 text-muted-foreground">
          Chargement de votre tableau de bord...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="af-display font-extrabold text-2xl">Mon espace acheteur</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivez vos commandes et découvrez de nouvelles offres
          </p>
        </div>
        <Button
          onClick={onBrowse}
          className="af-btn-accent rounded-lg px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5"
        >
          <Search size={16} /> Parcourir le marché
        </Button>
      </div>

      {/* Stats acheteur */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Commandes"
          value={String(stats?.totalOrders ?? 0)}
          icon={<ShoppingBag size={14} />}
        />
        <StatCard
          label="En cours"
          value={String(stats?.pendingOrders ?? 0)}
          icon={<Clock size={14} />}
          tone="warn"
        />
        <StatCard
          label="Livraisons"
          value={String(stats?.completedOrders ?? 0)}
          icon={<CheckCircle2 size={14} />}
          tone="ok"
        />
        <StatCard
          label="Total dépensé"
          value={fcfa(stats?.totalSpent ?? 0)}
          icon={<TrendingUp size={14} />}
          tone="primary"
        />
      </div>

      {/* Commandes récentes */}
      {recentOrders.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="af-display font-bold text-base">Commandes récentes</h3>
          </div>
          <div className="flex flex-col gap-2">
            {recentOrders.map((order) => (
              <Card
                key={order.id}
                className="af-card rounded-xl p-3 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background:
                      order.status === 'cancelled'
                        ? '#fee2e2'
                        : 'var(--agro-light)',
                  }}
                >
                  {order.status === 'delivered' ? (
                    <CheckCircle2 size={16} style={{ color: 'var(--agro-primary)' }} />
                  ) : order.status === 'cancelled' ? (
                    <Package size={16} style={{ color: 'var(--agro-danger)' }} />
                  ) : (
                    <Clock size={16} style={{ color: 'var(--agro-accent)' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{order.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.seller} · {order.date}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="af-display font-bold text-sm text-primary">
                    {fcfa(order.total)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {orderStatusLabel(order.status)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recommandations */}
      {recommended.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="af-display font-bold text-base">
              <Heart size={15} className="inline mr-1.5" style={{ color: 'var(--agro-accent)' }} />
              Offres recommandées
            </h3>
            <button
              onClick={onBrowse}
              className="text-xs font-semibold text-primary inline-flex items-center gap-0.5"
            >
              Voir tout <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommended.map((l) => (
              <ProductCard
                key={l.id}
                listing={l}
                onSelect={(item) => onSelectProduct(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state si aucune activité */}
      {recentOrders.length === 0 && recommended.length === 0 && (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--agro-pale)' }}
          >
            <ShoppingBag size={28} style={{ color: 'var(--agro-primary)' }} />
          </div>
          <h3 className="af-display font-bold text-lg mb-1">Bienvenue sur le marché</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Parcourez les offres disponibles et passez votre première commande.
          </p>
          <Button
            onClick={onBrowse}
            className="af-btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <Search size={16} /> Découvrir les offres
          </Button>
        </div>
      )}

      {/* Raccourcis rapides */}
      <section>
        <h3 className="af-display font-bold text-base mb-3">Raccourcis</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <QuickAction
            icon={Search}
            label="Parcourir le marché"
            onClick={onBrowse}
          />
          <QuickAction
            icon={Repeat}
            label="Mes commandes"
            onClick={onBrowse}
          />
          <QuickAction
            icon={MapPin}
            label="Offres près de moi"
            onClick={onBrowse}
          />
        </div>
      </section>
    </div>
  )
}

// ============================================================
// COMPOSANTS INTERNES
// ============================================================

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone?: 'primary' | 'ok' | 'warn' | 'muted'
}) {
  const toneStyle =
    tone === 'primary'
      ? { background: 'var(--agro-primary)', color: '#fff' }
      : tone === 'ok'
      ? { background: 'var(--agro-light)', color: 'var(--agro-primary)' }
      : tone === 'warn'
      ? { background: '#fef3c7', color: '#92400e' }
      : {}

  return (
    <div
      className="rounded-xl p-3 shadow-sm border"
      style={
        tone === 'primary' || tone === 'ok' || tone === 'warn'
          ? toneStyle
          : { background: 'var(--agro-card)', borderColor: 'var(--agro-border)' }
      }
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {icon} {label}
      </div>
      <div className="mt-1 af-display text-lg font-extrabold truncate">{value}</div>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Search
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="af-card rounded-xl p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'var(--agro-pale)' }}
      >
        <Icon size={18} style={{ color: 'var(--agro-primary)' }} />
      </div>
      <span className="text-sm font-semibold">{label}</span>
      <ChevronRight size={16} className="text-muted-foreground ml-auto shrink-0" />
    </button>
  )
}

function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  }
  return labels[status] ?? status
}