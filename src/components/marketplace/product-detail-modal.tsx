import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, ArrowLeft, MapPin, Phone, Share2, Flag, Minus, Plus, CircleCheck } from 'lucide-react'
import { CategoryBadge } from './category-badge'
import { StatusBadge } from './status-badge'
import { StarRating } from './stars'
import { cn } from '@/lib/utils'
import { productImage, fcfa, initials } from '@/lib/marketplace-data'
import type {
  MarketplaceListing,
  MarketplaceOrder,
} from '@/lib/marketplace-data'

interface ProductDetailModalProps {
  listing: MarketplaceListing
  allListings: MarketplaceListing[]
  jumpToOrder?: boolean
  onSelect: (listing: MarketplaceListing) => void
  onClose: () => void
  onPlaceOrder: (order: MarketplaceOrder) => void
}

export function ProductDetailModal({
  listing,
  allListings,
  jumpToOrder = false,
  onSelect,
  onClose,
  onPlaceOrder,
}: ProductDetailModalProps) {
  const [activeImg, setActiveImg] = useState(0)
  const [mode, setMode] = useState<'view' | 'order' | 'confirmed'>(
    jumpToOrder ? 'order' : 'view'
  )
  const [qty, setQty] = useState(listing.minOrder)
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('pickup')
  const [note, setNote] = useState('')

  const similar = allListings
    .filter((l) => l.category === listing.category && l.id !== listing.id)
    .slice(0, 5)

  const total = qty * listing.price

  function confirm() {
    const order: MarketplaceOrder = {
      id: `c${Date.now()}`,
      title: listing.title,
      seller: listing.seller,
      qty,
      unit: listing.unit,
      total,
      status: 'confirmed',
      date: "Aujourd'hui",
    }
    setMode('confirmed')
    onPlaceOrder(order)
  }

  function adjust(delta: number) {
    const next = qty + delta
    setQty(Math.max(listing.minOrder, Math.min(listing.qty, next)))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[92vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
          {mode === 'order' ? (
            <Button
              variant="ghost"
              onClick={() => setMode('view')}
              className="inline-flex items-center gap-1 text-sm font-semibold"
            >
              <ArrowLeft size={18} /> Retour
            </Button>
          ) : (
            <DialogTitle className="af-display font-bold">
              {mode === 'confirmed' ? 'Commande confirmée' : 'Détail de l\'offre'}
            </DialogTitle>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </DialogHeader>

        {mode === 'view' && (
          <div>
            <div className="relative af-aspect-43 bg-gray-100">
              <img
                src={productImage(listing.id, activeImg + 1)}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <StatusBadge status={listing.status} />
              </div>
            </div>

            <div className="flex gap-2 p-3 overflow-x-auto af-scrollbar-hide">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className="w-16 h-16 rounded-lg overflow-hidden shrink-0"
                  style={{
                    border:
                      activeImg === i
                        ? '2px solid var(--agro-primary)'
                        : '1px solid var(--agro-border)',
                  }}
                >
                  <img
                    src={productImage(listing.id, i + 1)}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </button>
              ))}
            </div>

            <div className="px-5 pb-5 flex flex-col gap-4">
              <div>
                <CategoryBadge category={listing.category} />
                <h2 className="af-display font-extrabold text-2xl mt-2">
                  {listing.title}
                </h2>
                <p className="text-sm mt-1 text-muted-foreground">
                  {listing.desc}
                </p>
              </div>

              <div className="flex items-end gap-2">
                <span className="af-display text-3xl font-extrabold text-primary">
                  {fcfa(listing.price)}
                </span>
                <span className="text-sm mb-1 text-muted-foreground">/ {listing.unit}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Card className="rounded-xl p-3">
                  <div className="text-muted-foreground">Quantité disponible</div>
                  <div className="font-semibold">{listing.qty} {listing.unit}</div>
                </Card>
                <Card className="rounded-xl p-3">
                  <div className="text-muted-foreground">Commande minimum</div>
                  <div className="font-semibold">{listing.minOrder} {listing.unit}</div>
                </Card>
                <Card className="rounded-xl p-3">
                  <div className="text-muted-foreground">Localisation</div>
                  <div className="font-semibold inline-flex items-center gap-1">
                    <MapPin size={13} /> {listing.city}, {listing.region}
                  </div>
                </Card>
                <Card className="rounded-xl p-3">
                  <div className="text-muted-foreground">Type de vente</div>
                  <div className="font-semibold capitalize">
                    {listing.saleType === 'gros' ? 'Vente en gros' : 'Vente au détail'}
                  </div>
                </Card>
              </div>

              <div className="af-card rounded-xl p-4 flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center af-display font-bold text-white shrink-0"
                  style={{ background: 'var(--agro-primary)' }}
                >
                  {initials(listing.seller)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{listing.seller}</div>
                  <StarRating rating={listing.rating} />
                </div>
                <Button variant="outline" className="af-btn-ghost rounded-lg px-3 py-2 text-xs font-semibold inline-flex items-center gap-1">
                  <Phone size={13} /> Contacter
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setMode('order')}
                  disabled={listing.status !== 'available'}
                  className="af-btn-primary flex-1 rounded-xl font-semibold h-12"
                >
                  {listing.status === 'available' ? 'Commander' : 'Indisponible'}
                </Button>
                <Button variant="outline" className="af-btn-ghost rounded-xl px-3.5 h-12">
                  <Share2 size={18} />
                </Button>
                <Button
                  variant="outline"
                  className="af-btn-ghost rounded-xl px-3.5 h-12"
                  style={{ color: 'var(--agro-danger)' }}
                >
                  <Flag size={18} />
                </Button>
              </div>

              {similar.length > 0 && (
                <div>
                  <h4 className="af-display font-bold text-sm mb-2">Vous aimerez aussi</h4>
                  <div className="flex gap-3 overflow-x-auto af-scrollbar-hide pb-1">
                    {similar.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onSelect(s)}
                        className="af-card rounded-xl overflow-hidden shrink-0 w-36 text-left"
                      >
                        <img
                          src={productImage(s.id, 1)}
                          className="w-full h-24 object-cover"
                          alt=""
                        />
                        <div className="p-2">
                          <div className="text-xs font-semibold line-clamp-1">{s.title}</div>
                          <div className="text-xs font-bold text-primary">{fcfa(s.price)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'order' && (
          <div className="p-5 flex flex-col gap-5">
            <div className="af-card rounded-xl p-3 flex gap-3 items-center">
              <img
                src={productImage(listing.id, 1)}
                className="w-14 h-14 rounded-lg object-cover"
                alt=""
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">{listing.title}</div>
                <div className="text-xs text-muted-foreground">
                  {fcfa(listing.price)} / {listing.unit}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold block mb-2">
                Quantité souhaitée ({listing.unit})
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => adjust(-listing.minOrder)}
                  className="af-btn-ghost rounded-full w-11 h-11 p-0"
                >
                  <Minus size={16} />
                </Button>
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) =>
                    setQty(
                      Math.max(
                        listing.minOrder,
                        Number(e.target.value) || listing.minOrder
                      )
                    )
                  }
                  className="af-input rounded-lg text-center py-2.5 w-24 font-semibold"
                />
                <Button
                  variant="outline"
                  onClick={() => adjust(listing.minOrder)}
                  className="af-btn-ghost rounded-full w-11 h-11 p-0"
                >
                  <Plus size={16} />
                </Button>
              </div>
              <p className="text-xs mt-1 text-muted-foreground">
                Minimum {listing.minOrder} {listing.unit} · {listing.qty}{' '}
                {listing.unit} disponibles
              </p>
            </div>

            <div>
              <Label className="text-sm font-semibold block mb-2">Livraison</Label>
              <div className="flex gap-2">
                {[
                  ['pickup', 'Retrait sur place'],
                  ['delivery', 'Livraison'],
                ].map(([v, l]) => (
                  <Button
                    key={v}
                    variant="outline"
                    onClick={() => setDelivery(v as 'pickup' | 'delivery')}
                    className={cn(
                      'af-chip rounded-lg px-3.5 py-2.5 text-sm font-medium flex-1',
                      delivery === v && 'af-chip-active'
                    )}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold block mb-2">
                Note pour le vendeur (optionnel)
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Ex : merci de préparer la commande avant 8h..."
                className="af-input rounded-lg px-3 py-2.5 text-sm w-full resize-none"
              />
            </div>

            <div className="af-card rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="af-display text-xl font-extrabold text-primary">{fcfa(total)}</span>
            </div>

            <Button
              onClick={confirm}
              className="af-btn-primary rounded-xl font-semibold h-12"
            >
              Confirmer la commande
            </Button>
          </div>
        )}

        {mode === 'confirmed' && (
          <div className="p-8 flex flex-col items-center text-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--agro-light)' }}
            >
              <CircleCheck size={32} className="text-primary" />
            </div>
            <h3 className="af-display font-bold text-lg">Commande envoyée</h3>
            <p className="text-sm max-w-xs text-muted-foreground">
              {listing.seller} a reçu votre demande pour {qty} {listing.unit} de{' '}
              {listing.title}. Vous serez notifié dès confirmation.
            </p>
            <Button onClick={onClose} className="af-btn-primary rounded-lg px-5 py-3 text-sm font-semibold mt-2">
              Suivre mes commandes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { Card } from '@/components/ui/card'
