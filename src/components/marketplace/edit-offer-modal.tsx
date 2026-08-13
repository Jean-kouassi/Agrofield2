import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { MarketplaceListing } from '@/lib/marketplace-data'

interface EditOfferModalProps {
  listing: MarketplaceListing | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const CATEGORIES = ['tomates', 'oignons', 'mil', 'sorgho', 'mais', 'niebe', 'arachide', 'coton', 'mangue', 'autre']
const UNITS = ['kg', 'sac', 'panier', 'caisse', 'unite']
const REGIONS = [
  'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est', 'Centre-Nord', 'Centre-Ouest',
  'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'
]

export function EditOfferModal({ listing, open, onOpenChange, onSuccess }: EditOfferModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: '',
    price: '',
    location: '',
    region: '',
  })

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || listing.desc || '',
        category: listing.category || '',
        quantity: listing.quantity?.toString() || listing.qty?.toString() || '',
        unit: listing.unit || '',
        price: listing.price?.toString() || '',
        location: listing.location || listing.city || '',
        region: listing.region || '',
      })
    }
  }, [listing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!listing) return

    setLoading(true)

    try {
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location.trim(),
        region: formData.region,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('marketplace_listings')
        .update(updateData)
        .eq('id', listing.id)

      if (error) throw error

      toast.success('✅ Offre modifiée avec succès !')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating offer:', error)
      toast.error('❌ Erreur lors de la modification: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Modifier l'offre</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="edit-title">Titre *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-unit">Unité *</Label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                <SelectTrigger id="edit-unit">
                  <SelectValue placeholder="kg" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-quantity">Quantité *</Label>
              <Input
                id="edit-quantity"
                type="number"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-price">Prix (FCFA) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-location">Localisation *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-region">Région *</Label>
              <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                <SelectTrigger id="edit-region">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
