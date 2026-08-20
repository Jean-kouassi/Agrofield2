import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Plus,
  Eye,
  Package,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductCard } from './product-card'
import { cn } from '@/lib/utils'
import {
  SALES_7D,
  fcfa,
  type MarketplaceListing,
} from '@/lib/marketplace-data'
import { fetchMyListings } from '@/lib/marketplace.service'

interface SellerDashboardProps {
  myListings: MarketplaceListing[]
  onPublish: () => void
  onEdit: (listing: MarketplaceListing) => void
  onDelete: (listing: MarketplaceListing) => void
}

export function SellerDashboard({
  myListings: initialListings,
  onPublish,
  onEdit,
  onDelete,
}: SellerDashboardProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>(initialListings || [])
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadListings() {
      try {
        const fetchedListings = await fetchMyListings()
        setListings(fetchedListings as MarketplaceListing[])
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (!initialListings) {
      loadListings()
    } else {
      setLoading(false)
    }
  }, [initialListings])

  const filtered = listings.filter((l) => {
    if (tab === 'all') return true
    if (tab === 'active') return l.status === 'available'
    if (tab === 'sold') return l.status === 'sold'
    return l.status === 'reserved'
  })

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <p className="text-sm text-center py-10 text-muted-foreground">Chargement de vos offres...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="af-display font-extrabold text-2xl">Mes offres</h2>
        <Button onClick={onPublish} className="af-btn-accent rounded-lg px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5">
          <Plus size={16} /> Nouvelle offre
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="af-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs mb-1 text-muted-foreground">
            <Eye size={13} /> Vues (30j)
          </div>
          <div className="af-display text-xl font-extrabold">3 842</div>
        </Card>

        <Card className="af-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs mb-1 text-muted-foreground">
            <Package size={13} /> Commandes
          </div>
          <div className="af-display text-xl font-extrabold">57</div>
        </Card>

        <Card className="af-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs mb-1 text-muted-foreground">
            <TrendingUp size={13} /> Revenus (7j)
          </div>
          <div className="af-display text-xl font-extrabold text-primary">{fcfa(SALES_7D.reduce((a, b) => a + b.ventes, 0))}</div>
        </Card>
      </div>

      <Card className="af-card rounded-xl p-4 mb-6">
        <h3 className="af-display font-bold text-sm mb-3">Ventes des 7 derniers jours</h3>
        <div className="w-full" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={SALES_7D}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="afSalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#166534" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#166534" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#dce8dd"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#5b6e60' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#5b6e60' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                formatter={(v: number) => fcfa(v)}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #dce8dd',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="ventes"
                stroke="#166534"
                strokeWidth={2.5}
                fill="url(#afSalesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        className="af-card rounded-xl p-3 mb-4 flex items-center gap-2 text-sm"
        style={{ background: '#fef3c7', border: '1px solid #fde68a' }}
      >
        <AlertCircle
          size={16}
          style={{ color: 'var(--agro-accent)' }}
          className="shrink-0"
        />
        <span>2 offres ont un stock faible et 3 commandes sont en attente de validation.</span>
      </Card>

      <div className="flex gap-2 mb-4 overflow-x-auto af-scrollbar-hide" data-swipe-ignore>
        {[
          ['active', 'Actives'],
          ['reserved', 'Réservées'],
          ['sold', 'Épuisées'],
          ['all', 'Toutes'],
        ].map(([v, l]) => (
          <Button
            key={v}
            variant="outline"
            onClick={() => setTab(v)}
            className={cn(
              'af-chip rounded-full px-4 py-2 text-sm font-semibold',
              tab === v && 'af-chip-active'
            )}
          >
            {l}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((l) => (
          <ProductCard
            key={l.id}
            listing={l}
            mine
            onSelect={() => {}}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm col-span-2 text-center py-8 text-muted-foreground">
            Aucune offre dans cette catégorie.
          </p>
        )}
      </div>
    </div>
  )
}
