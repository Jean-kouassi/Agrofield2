/**
 * AgroConnect - Create Offer Form Component
 * Formulaire de publication d'offre réutilisable
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload } from 'lucide-react'
import { createOffer } from '@/lib/marketplace'
import type { ProductCategory, UnitType } from '@/types/marketplace'

interface CreateOfferFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const categories: ProductCategory[] = [
  'tomates', 'oignons', 'mil', 'sorgho', 'mais',
  'niebe', 'arachide', 'coton', 'mangue', 'autre'
]

const units: UnitType[] = ['kg', 'sac', 'panier', 'caisse', 'unite']

const regions = [
  'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est',
  'Centre-Nord', 'Centre-Ouest', 'Centre-Sud', 'Est',
  'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'
]

export function CreateOfferForm({ onSuccess, onCancel }: CreateOfferFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ProductCategory,
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
      // TODO: Get seller ID from auth context
      const sellerId = 'current-user-id'
      const sellerName = 'Agriculteur Local'

      await createOffer({
        sellerId,
        sellerName,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location,
        region: formData.region,
        images: [],
        availableFrom: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Failed to create offer:', error)
      alert('Erreur lors de la publication. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations sur votre produit</CardTitle>
        <CardDescription>
          Remplissez ce formulaire pour publier votre offre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
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

          {/* Category & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                required
                className="h-12"
              />
            </div>
          </div>

          {/* Unit & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleChange('unit', value as UnitType)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Prix par unité (FCFA) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="500"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                required
                className="h-12"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Ville/Village *</Label>
              <Input
                id="location"
                placeholder="Ex: Saaba"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Région *</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => handleChange('region', value)}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos du produit</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Ajoutez des photos pour attirer plus d'acheteurs
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bientôt disponible
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1 h-12"
                onClick={onCancel}
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-12"
              disabled={loading}
            >
              {loading ? 'Publication en cours...' : 'Publier mon offre'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Votre offre sera visible pendant 30 jours
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
