import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, Leaf, CheckCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { ProductCategory, UnitType } from '@/types/marketplace'

export const Route = createFileRoute('/marketplace/create')({
  ssr: false,
  component: CreateOfferPage,
})

function CreateOfferPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // DEBUG + Auth check
  useEffect(() => {
    console.log('🔍 CreateOfferPage MOUNTED')
    supabase.auth.getUser().then(({ data }) => {
      console.log('👤 User:', data.user)
      setUser(data.user)
      setCheckingAuth(false)
    })
  }, [])
  
  // Si en train de vérifier l'auth ou pas connecté
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-600" />
              Connexion requise
            </CardTitle>
            <CardDescription>
              Vous devez être connecté pour créer une offre sur le marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => router.navigate({ to: '/auth' })}
            >
              Se connecter
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.navigate({ to: '/' })}
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const categories: ProductCategory[] = [
    'tomates',
    'oignons',
    'mil',
    'sorgho',
    'mais',
    'niebe',
    'arachide',
    'coton',
    'mangue',
    'autre'
  ]

  const units: UnitType[] = ['kg', 'sac', 'panier', 'caisse', 'unite']

  const regions = [
    'Centre',
    'Boucle du Mouhoun',
    'Cascades',
    'Centre-Est',
    'Centre-Nord',
    'Centre-Ouest',
    'Centre-Sud',
    'Est',
    'Hauts-Bassins',
    'Nord',
    'Plateau-Central',
    'Sahel',
    'Sud-Ouest'
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        toast.error('Vous devez etre connecte pour publier une offre')
        return
      }

      const offerData = {
        seller_id: user.id,
        seller_name: user.email || 'Agriculteur',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location,
        region: formData.region,
        images: [],
        available_from: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available',
        views: 0,
        contacts: 0
      }

      const { data, error } = await supabase
        .from('offers')
        .insert([offerData])
        .select()

      if (error) throw error

      setSuccess(true)
      setTimeout(() => { router.navigate({ to: '/marketplace' }) }, 2000)

    } catch (error: any) {
      toast.error('Erreur: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Offre publiée avec succès ! 🎉</h2>
            <p className="text-gray-600 mb-4">
              Votre produit sera bientôt visible sur le marketplace.
            </p>
            <p className="text-sm text-gray-500">
              Redirection vers le marketplace...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-green-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link 
            to="/marketplace"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au marketplace
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-xl border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <Leaf className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl">Publier une nouvelle offre</CardTitle>
                <CardDescription className="text-green-100">
                  Remplissez le formulaire pour publier votre produit sur le marketplace
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre */}
              <div>
                <Label htmlFor="title" className="font-semibold text-gray-700">
                  Titre de l'offre *
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Tomates fraîches - Récolte du jour"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  className="mt-1 border-2 border-gray-300 focus:border-green-500"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="font-semibold text-gray-700">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre produit (qualité, mode de culture, disponibilité...)"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  required
                  rows={4}
                  className="mt-1 border-2 border-gray-300 focus:border-green-500 resize-none"
                />
              </div>

              {/* Catégorie et Unité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="font-semibold text-gray-700">
                    Catégorie *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                    required
                  >
                    <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-green-500">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit" className="font-semibold text-gray-700">
                    Unité de mesure *
                  </Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleChange('unit', value)}
                  >
                    <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantité et Prix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity" className="font-semibold text-gray-700">
                    Quantité disponible *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    required
                    className="mt-1 border-2 border-gray-300 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="font-semibold text-gray-700">
                    Prix unitaire (FCFA) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="500"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    required
                    className="mt-1 border-2 border-gray-300 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Localisation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="font-semibold text-gray-700">
                    Ville / Localité *
                  </Label>
                  <Input
                    id="location"
                    placeholder="Ex: Ouagadougou"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    required
                    className="mt-1 border-2 border-gray-300 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="region" className="font-semibold text-gray-700">
                    Région *
                  </Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => handleChange('region', value)}
                    required
                  >
                    <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-green-500">
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((reg) => (
                        <SelectItem key={reg} value={reg}>
                          {reg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1 border-2"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Publication en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Publier l'offre
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Le saviez-vous ?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Les offres avec photos ont 3x plus de chances d'être vendues</li>
            <li>• Un prix compétitif attire plus d'acheteurs</li>
            <li>• Soyez précis sur la qualité et la disponibilité</li>
            <li>• La commission est de 0% pendant la période de lancement !</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
