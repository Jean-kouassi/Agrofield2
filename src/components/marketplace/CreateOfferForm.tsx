import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Leaf } from 'lucide-react'
import { createOffer } from '@/lib/marketplace'
import { toast } from 'sonner'
import type { ProductCategory, UnitType } from '@/types/marketplace'

interface CreateOfferFormProps {
  onSuccess?: () => void
}

const categories: ProductCategory[] = [
  'tomates', 'oignons', 'mil', 'sorgho', 'mais', 'niebe', 'arachide', 'coton', 'mangue', 'autre'
]

const units: UnitType[] = ['kg', 'sac', 'panier', 'caisse', 'unite']

const regions = [
  'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est', 'Centre-Nord', 'Centre-Ouest',
  'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'
]

export function CreateOfferForm({ onSuccess }: CreateOfferFormProps) {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ProductCategory | '',
    quantity: '',
    unit: 'kg' as UnitType,
    price: '',
    location: '',
    region: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await createOffer({
        seller_id: 'current-user-id',
        seller_name: 'Agriculteur',
        title: formData.title,
        description: formData.description,
        category: formData.category as string,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location,
        region: formData.region,
        images: [],
        available_from: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available',
      })

      toast.success('Offre publiée avec succès !')
      onSuccess?.()
    } catch (error: any) {
      console.error('Failed to create offer:', error)
      toast.error('Erreur lors de la publication: ' + (error?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          Informations sur votre produit
        </CardTitle>
        <CardDescription>
          Remplissez ce formulaire pour publier votre offre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'offre *</Label>
            <Input
              id="title"
              placeholder="Ex: Tomates fraîches - Récolte récente"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              className="h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre produit : qualité, variété, mode de culture..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              rows={4}
            />
          </div>

          {/* Catégorie + Unité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v as ProductCategory }))}
              >
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unité *</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, unit: v as UnitType }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantité + Prix */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Prix / unité (FCFA) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Localisation + Région */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localisation (ville) *</Label>
              <Input
                id="location"
                placeholder="Ex: Ouagadougou"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Région *</Label>
              <Select
                value={formData.region}
                onValueChange={(v) => handleChange('region', v)}
              >
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Publication en cours...' : 'Publier l\'offre'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}