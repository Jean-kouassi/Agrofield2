import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, Leaf, CheckCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import type { ProductCategory } from '@/types/marketplace'
import { toast } from 'sonner'

export const Route = createFileRoute('/marketplace/create')({
  component: CreateOfferPage,
})

function CreateOfferPage() {
  const router = useRouter()
  const { user } = Route.useRouteContext()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ProductCategory,
    quantity: '',
    unit: 'kg',
    price: '',
    location: '',
    region: '',
  })

  const categories: ProductCategory[] = [
    'tomates', 'oignons', 'mil', 'sorgho', 'mais', 
    'niebe', 'arachide', 'coton', 'mangue', 'autre'
  ]

  const units = ['kg', 'sac', 'panier', 'caisse', 'unite']

  const regions = [
    'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est',
    'Centre-Nord', 'Centre-Ouest', 'Centre-Sud', 'Est',
    'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      toast.error('Veuillez vous connecter')
      router.navigate({ to: '/auth' })
      return
    }

    setLoading(true)
    try {
      const offerData = {
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location,
        region: formData.region,
        payment_methods: ['cash', 'orange_money', 'moov_money'],
        status: 'active' as const,
      }

      const { error } = await supabase.from('offers').insert([offerData])
      
      if (error) throw error
      
      toast.success('Offre publiée avec succès!')
      router.navigate({ to: '/marketplace' })
    } catch (error) {
      console.error('Erreur publication:', error)
      toast.error('Erreur lors de la publication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      {/* Header */}
      <header className="mb-8 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.navigate({ to: '/marketplace' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au marketplace
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Publier une offre</h1>
          <p className="text-muted-foreground mt-2">
            Vendez vos produits agricoles sur le marketplace
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Détails de l'offre</CardTitle>
            <CardDescription>
              Remplissez les informations pour publier votre produit
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  required
                  placeholder="Ex: Tomates fraîches - Récolte du jour"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  rows={4}
                  placeholder="Décrivez votre produit (qualité, variété, conditions de vente...)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unité *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Prix (FCFA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localité</Label>
                  <Input
                    id="location"
                    placeholder="Ville/village"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Région</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.navigate({ to: '/marketplace' })}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Publication...' : 'Publier l\'offre'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info box */}
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Bon à savoir :</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Publication gratuite pendant la période de lancement</li>
                <li>Votre offre sera visible immédiatement</li>
                <li>Les acheteurs peuvent vous contacter directement</li>
                <li>Vous pouvez modifier ou supprimer votre offre à tout moment</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
