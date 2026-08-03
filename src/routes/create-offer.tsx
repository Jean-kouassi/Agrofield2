import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Leaf, CheckCircle, Upload } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { ProductCategory, UnitType } from '@/types/marketplace'

export const Route = createFileRoute('/create-offer')({
  ssr: false,
  component: CreateOfferPage,
})

const categories: ProductCategory[] = [
  'tomates', 'oignons', 'mil', 'sorgho', 'mais', 'niebe', 'arachide', 'coton', 'mangue', 'autre'
]

const units: UnitType[] = ['kg', 'sac', 'panier', 'caisse', 'unite']

const regions = [
  'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est', 'Centre-Nord', 'Centre-Ouest',
  'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'
]

function CreateOfferPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
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
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    console.log('🔍 CreateOfferPage MOUNTED - Checking auth...')
    supabase.auth.getUser().then(({ data }) => {
      console.log('👤 User:', data.user ? data.user.email : 'NOT LOGGED IN')
      setUser(data.user)
      setCheckingAuth(false)
    })
  }, [])

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
              Vous devez être connecté pour créer une offre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => router.navigate({ to: '/auth' })}>Se connecter</Button>
            <Button variant="outline" onClick={() => router.navigate({ to: '/' })}>Retour à l'accueil</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setUploadingImages(true)
    console.log('📤 Submitting offer...', formData)

    try {
      // 1. Upload images d'abord si il y en a
      let imageUrls: string[] = []
      
      if (selectedImages.length > 0) {
        console.log('📸 Uploading', selectedImages.length, 'images...')
        const uploadPromises = selectedImages.map(async (file) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { data, error } = await supabase.storage
            .from('marketplace-images')
            .upload(`offers/${fileName}`, file, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (error) throw error
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('marketplace-images')
            .getPublicUrl(`offers/${fileName}`)
          
          return publicUrl
        })
        
        imageUrls = await Promise.all(uploadPromises)
        console.log('✅ Images uploaded:', imageUrls)
      }
      
      setUploadingImages(false)

      // 2. Créer l'offre avec les URLs d'images
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
        images: imageUrls,
        available_from: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available',
        views: 0,
        contacts: 0
      }

      console.log('📤 Inserting into marketplace_listings:', offerData)

      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert([offerData])
        .select()

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ Success! Created offer:', data)
      setSuccess(true)
      setTimeout(() => router.navigate({ to: '/marketplace' }), 2000)
    } catch (error: any) {
      console.error('❌ Error:', error)
      setUploadingImages(false)
      toast.error('Erreur: ' + error.message)
    } finally {
      setLoading(false)
    }
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
            <p className="text-gray-600 mb-4">Votre produit sera bientôt visible sur le marketplace.</p>
            <p className="text-sm text-gray-500">Redirection vers le marketplace...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <header className="bg-white border-b border-green-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.navigate({ to: '/marketplace' })}
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au marketplace
          </button>
        </div>
      </header>

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
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="mt-1 border-2 border-gray-300 focus:border-green-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="font-semibold text-gray-700">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre produit (qualité, variété, mode de culture...)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  className="mt-1 border-2 border-gray-300 focus:border-green-500 transition-colors"
                />
              </div>

              {/* Photos du produit */}
              <div>
                <Label className="font-semibold text-gray-700">
                  Photos du produit
                </Label>
                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors bg-gray-50">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Glissez-déposez vos photos ici ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-gray-500">
                    Formats: JPG, PNG (max 5Mo par image)
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="mt-3"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setSelectedImages(files)
                      console.log('📸 Selected files:', files.map(f => `${f.name} (${(f.size/1024).toFixed(1)} KB)`))
                    }}
                  />
                  {selectedImages.length > 0 && (
                    <div className="mt-3 text-sm text-green-600">
                      ✅ {selectedImages.length} image(s) sélectionnée(s)
                    </div>
                  )}
                </div>
              </div>

              {/* Catégorie et Unité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="font-semibold text-gray-700">
                    Catégorie *
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: ProductCategory) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-green-500">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit" className="font-semibold text-gray-700">
                    Unité *
                  </Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(value: UnitType) => setFormData(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-green-500">
                      <SelectValue placeholder="Unité" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantité et Prix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity" className="font-semibold text-gray-700">
                    Quantité *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    className="mt-1 border-2 border-gray-300 focus:border-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="font-semibold text-gray-700">
                    Prix par unité (FCFA) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    placeholder="500"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                    className="mt-1 border-2 border-gray-300 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Localisation et Région */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="font-semibold text-gray-700">
                    Ville / Localité *
                  </Label>
                  <Input
                    id="location"
                    placeholder="Ex: Ouagadougou, Bobo-Dioulasso..."
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
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
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, region: value }))}
                  >
                    <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-green-500">
                      <SelectValue placeholder="Choisir une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((reg) => (
                        <SelectItem key={reg} value={reg}>{reg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bouton submit */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-lg shadow-lg"
                disabled={loading || uploadingImages}
              >
                {uploadingImages ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Upload des images en cours...
                  </>
                ) : loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Publication en cours...
                  </>
                ) : (
                  <>
                    <Leaf className="w-5 h-5 mr-2" />
                    Publier l'offre
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
