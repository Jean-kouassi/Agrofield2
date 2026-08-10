import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import {
  CheckCircle2,
  Package,
  Truck,
  PackageCheck,
  X,
  ChevronRight,
  Phone,
  Star,
  ShoppingBag,
  Store,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ORDER_LABEL,
  ORDER_STEPS,
  type MarketplaceOrder,
  type OrderStatus,
  fcfa,
} from '@/lib/marketplace-data'
import {
  fetchMyBuyOrders,
  fetchMySellOrders,
  updateOrderStatus,
} from '@/lib/marketplace-service'

// ============================================================
// ORDERS VIEW — Dual mode (Acheteur / Vendeur)
// ============================================================

type OrderRole = 'buyer' | 'seller'
type OrderFilterTab = 'all' | 'ongoing' | 'done' | 'cancelled'

const statusIcon: Record<OrderStatus, typeof Package> = {
  confirmed: CheckCircle2,
  preparing: Package,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: X,
}

interface OrdersViewProps {
  orders?: MarketplaceOrder[]
  initialRole?: OrderRole
}

export function OrdersView({ orders: initialOrders, initialRole = 'buyer' }: OrdersViewProps) {
  const [role, setRole] = useState<OrderRole>(initialRole)
  const [orders, setOrders] = useState<MarketplaceOrder[]>(initialOrders || [])
  const [filterTab, setFilterTab] = useState<OrderFilterTab>('all')
  const [openOrder, setOpenOrder] = useState<MarketplaceOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // Actions possibles selon le rôle et le statut
  const getAvailableActions = (status: OrderStatus, orderRole: OrderRole) => {
    const actions: { label: string; action: () => void; variant: 'primary' | 'outline' | 'danger' }[] = []

    if (orderRole === 'buyer') {
      // Acheteur peut annuler si pas encore expédié
      if (['confirmed', 'preparing'].includes(status)) {
        actions.push({
          label: 'Annuler',
          action: () => handleAction('cancelled'),
          variant: 'danger',
        })
      }
      // Acheteur peut confirmer réception si expédié
      if (status === 'shipped') {
        actions.push({
          label: 'Confirmer réception',
          action: () => handleAction('delivered'),
          variant: 'primary',
        })
      }
    } else {
      // Vendeur peut confirmer une commande en attente
      if (status === 'confirmed') {
        actions.push({
          label: 'Accepter',
          action: () => handleAction('preparing'),
          variant: 'primary',
        })
        actions.push({
          label: 'Refuser',
          action: () => handleAction('cancelled'),
          variant: 'danger',
        })
      }
      // Vendeur peut marquer comme expédié
      if (status === 'preparing') {
        actions.push({
          label: 'Expédier',
          action: () => handleAction('shipped'),
          variant: 'primary',
        })
      }
      // Vendeur peut marquer comme livré
      if (status === 'shipped') {
        actions.push({
          label: 'Marquer livré',
          action: () => handleAction('delivered'),
          variant: 'primary',
        })
      }
    }

    return actions
  }

  const handleAction = useCallback(async (newStatus: OrderStatus) => {
    if (!openOrder) return
    try {
      const dbStatus = mapUIToDBStatus(newStatus)
      await updateOrderStatus(openOrder.id, dbStatus)
      // Mettre à jour localement
      setOrders((prev) =>
        prev.map((o) => (o.id === openOrder.id ? { ...o, status: newStatus } : o))
      )
      setOpenOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      setToast(`Commande mise à jour: ${ORDER_LABEL[newStatus]}`)
      setTimeout(() => setToast(''), 3000)
    } catch (error: any) {
      setToast(error.message || 'Erreur lors de la mise à jour')
      setTimeout(() => setToast(''), 3000)
    }
  }, [openOrder])

  // Charger les commandes selon le rôle
  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      try {
        const fetched = role === 'buyer' ? await fetchMyBuyOrders() : await fetchMySellOrders()
        setOrders(fetched as MarketplaceOrder[])
      } catch (error) {
        console.error(`Error loading ${role} orders:`, error)
        // Fallback: si initialOrders fournis, les utiliser
        if (initialOrders) setOrders(initialOrders)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [role]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = orders.filter((o) => {
    if (filterTab === 'all') return true
    if (filterTab === 'ongoing')
      return ['confirmed', 'preparing', 'shipped'].includes(o.status)
    if (filterTab === 'done') return o.status === 'delivered'
    if (filterTab === 'cancelled') return o.status === 'cancelled'
    return true
  })

  // Stats rapides
  const ongoingCount = orders.filter((o) =>
    ['confirmed', 'preparing', 'shipped'].includes(o.status)
  ).length
  const doneCount = orders.filter((o) => o.status === 'delivered').length
  const totalAmount = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      <h2 className="af-display font-extrabold text-2xl mb-4">Commandes</h2>

      {/* Sélecteur de rôle: Acheteur / Vendeur */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setRole('buyer')}
          className={cn(
            'flex-1 rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200',
            role === 'buyer'
              ? 'text-white shadow-md'
              : 'af-card text-muted-foreground hover:bg-[var(--agro-pale)]'
          )}
          style={role === 'buyer' ? { background: 'var(--agro-primary)' } : {}}
        >
          <ShoppingBag size={16} /> Mes achats
        </button>
        <button
          onClick={() => setRole('seller')}
          className={cn(
            'flex-1 rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200',
            role === 'seller'
              ? 'text-white shadow-md'
              : 'af-card text-muted-foreground hover:bg-[var(--agro-pale)]'
          )}
          style={role === 'seller' ? { background: 'var(--agro-primary)' } : {}}
        >
          <Store size={16} /> Mes ventes
        </button>
      </div>

      {/* Stats rapides */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="af-card rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Clock size={12} /> En cours
            </div>
            <div className="af-display font-bold text-lg">{ongoingCount}</div>
          </Card>
          <Card className="af-card rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <CheckCircle2 size={12} /> Terminées
            </div>
            <div className="af-display font-bold text-lg">{doneCount}</div>
          </Card>
          <Card className="af-card rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              {role === 'buyer' ? <ShoppingBag size={12} /> : <Store size={12} />}
              {role === 'buyer' ? 'Dépensé' : 'Revenu'}
            </div>
            <div className="af-display font-bold text-sm text-primary">{fcfa(totalAmount)}</div>
          </Card>
        </div>
      )}

      {/* Filtres de statut */}
      <div className="flex gap-2 mb-5 overflow-x-auto af-scrollbar-hide">
        {([
          ['all', 'Toutes'],
          ['ongoing', 'En cours'],
          ['done', 'Terminées'],
          ['cancelled', 'Annulées'],
        ] as [OrderFilterTab, string][]).map(([v, l]) => (
          <Button
            key={v}
            variant="outline"
            onClick={() => setFilterTab(v)}
            className={cn(
              'af-chip rounded-full px-4 py-2 text-sm font-semibold',
              filterTab === v && 'af-chip-active'
            )}
          >
            {l}
          </Button>
        ))}
      </div>

      {/* Liste des commandes */}
      <div className="flex flex-col gap-3">
        {loading && (
          <p className="text-sm text-center py-10 text-muted-foreground">
            Chargement des commandes...
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground mb-2">
              {role === 'buyer'
                ? 'Aucune commande en tant qu\'acheteur.'
                : 'Aucune commande en tant que vendeur.'}
            </p>
            <p className="text-xs text-muted-foreground">
              {filterTab !== 'all' ? 'Essayez un autre filtre.' : ''}
            </p>
          </div>
        )}
        {!loading && filtered.map((o) => {
          const Icon = statusIcon[o.status]
          return (
            <button
              key={o.id}
              onClick={() => setOpenOrder(o)}
              className="af-card rounded-xl p-4 flex items-center gap-4 text-left"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background:
                    o.status === 'cancelled' ? '#fee2e2' : 'var(--agro-light)',
                }}
              >
                <Icon
                  size={18}
                  style={{
                    color:
                      o.status === 'cancelled'
                        ? 'var(--agro-danger)'
                        : 'var(--agro-primary)',
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{o.title}</div>
                <div className="text-xs text-muted-foreground">
                  {role === 'buyer' ? o.seller : 'Acheteur'} · {o.date}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="af-display font-bold text-sm text-primary">
                  {fcfa(o.total)}
                </div>
                <div className="text-xs text-muted-foreground">{ORDER_LABEL[o.status]}</div>
              </div>

              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          )
        })}
      </div>

      {/* Modal détail */}
      {openOrder && (
        <OrderDetailModal
          order={openOrder}
          role={role}
          onClose={() => setOpenOrder(null)}
          actions={getAvailableActions(openOrder.status, role)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="af-toast fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card shadow-xl rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-medium border"
          style={{ borderColor: 'var(--agro-border)' }}
        >
          <CheckCircle2 size={16} className="text-primary" /> {toast}
        </div>
      )}
    </div>
  )
}

// ============================================================
// MODAL DÉTAIL — Avec actions selon le rôle
// ============================================================

interface OrderDetailModalProps {
  order: MarketplaceOrder
  role: OrderRole
  onClose: () => void
  actions: { label: string; action: () => void; variant: 'primary' | 'outline' | 'danger' }[]
}

function OrderDetailModal({ order, role, onClose, actions }: OrderDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center af-modal-overlay"
      onClick={onClose}
    >
      <div
        className="af-modal-panel bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="af-display font-bold text-lg">Détail de la commande</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {role === 'buyer' ? 'Vous êtes l\'acheteur' : 'Vous êtes le vendeur'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Info produit */}
        <Card className="rounded-xl p-3 mb-4">
          <div className="font-semibold text-sm">{order.title}</div>
          <div className="text-xs text-muted-foreground">
            {order.qty} {order.unit} · {role === 'buyer' ? order.seller : 'Acheteur'}
          </div>
          <div className="af-display font-bold mt-1 text-primary">{fcfa(order.total)}</div>
        </Card>

        {/* Timeline de progression */}
        {order.status !== 'cancelled' ? (
          <div className="flex items-center justify-between mb-5">
            {ORDER_STEPS.map((s, i) => {
              const reached = ORDER_STEPS.indexOf(order.status) >= i
              const isCurrent = ORDER_STEPS.indexOf(order.status) === i
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{
                        background: reached
                          ? 'var(--agro-primary)'
                          : '#e2e8e0',
                        boxShadow: isCurrent ? '0 0 0 3px rgba(22,101,52,0.18)' : 'none',
                      }}
                    >
                      {reached ? <CheckCircle2 size={13} color="#fff" /> : <span className="text-xs font-bold" style={{ color: 'var(--agro-muted)' }}>{i + 1}</span>}
                    </div>
                    <span className="af-text-10 text-center w-14"
                      style={{
                        color: reached
                          ? 'var(--agro-primary)'
                          : 'var(--agro-muted)',
                        fontWeight: isCurrent ? 700 : 500,
                      }}
                    >
                      {ORDER_LABEL[s]}
                    </span>
                  </div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div
                      className="flex-1 h-1 rounded-full mx-1"
                      style={{
                        background: reached
                          ? 'var(--agro-primary)'
                          : '#e2e8e0',
                      }}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        ) : (
          <Badge className="rounded-lg p-3 text-sm text-center mb-5 w-full justify-center">
            Cette commande a été annulée.
          </Badge>
        )}

        {/* Actions selon le rôle */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="af-btn-ghost flex-1 rounded-lg py-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Phone size={15} /> Contacter
          </Button>

          {actions.map((a, i) => (
            <Button
              key={i}
              onClick={a.action}
              className={cn(
                'flex-1 rounded-lg py-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5',
                a.variant === 'primary' && 'af-btn-primary',
                a.variant === 'danger' && 'text-white',
              )}
              style={
                a.variant === 'danger'
                  ? { background: 'var(--agro-danger)' }
                  : undefined
              }
            >
              {a.variant === 'danger' ? <X size={15} /> : <CheckCircle2 size={15} />}
              {a.label}
            </Button>
          ))}

          {order.status === 'delivered' && actions.length === 0 && (
            <Button className="af-btn-primary flex-1 rounded-lg py-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5">
              <Star size={15} /> Laisser un avis
            </Button>
          )}
        </div>

        {/* Note info si pas d'actions */}
        {actions.length === 0 && order.status !== 'delivered' && (
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <AlertCircle size={14} className="shrink-0" />
            {role === 'buyer'
              ? 'En attente de traitement par le vendeur.'
              : 'Aucune action requise pour le moment.'}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Map les statuts UI vers les statuts DB Supabase
 */
function mapUIToDBStatus(uiStatus: OrderStatus): 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' {
  const map: Record<OrderStatus, 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'> = {
    confirmed: 'confirmed',
    preparing: 'processing',
    shipped: 'processing', // Pas de statut "shipped" en DB, on garde processing
    delivered: 'completed',
    cancelled: 'cancelled',
  }
  return map[uiStatus]
}