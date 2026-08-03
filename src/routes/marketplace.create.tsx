import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Leaf, CheckCircle, Upload, Trash2, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { ProductCategory, UnitType } from '@/types/marketplace'

export const Route = createFileRoute('/marketplace/create')({
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
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  })

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
            <Button variant="outline" onClick={() => router.navigate({ to: '/' })}>Retour</Button>
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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    // Max 5 images, max 5MB chacune
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024).slice(0, 5 - selectedImages.length)
    
    if (validFiles.length < files.length) {
      toast.warning('Certaines images ont été ignorées (max 5 images, 5MB chacune)')
    }

    setSelectedImages(prev => [...prev, ...validFiles])
    
    // Previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  function removeImage(index: number) {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadImages(userId: string): Promise<string[]> {
    if (selectedImages.length === 0) return []

    const uploadPromises = selectedImages.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('marketplace-images')
        .upload(`offers/${userId}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(`offers/${userId}/${fileName}`)

      return publicUrl
    })

    return Promise.all(uploadPromises)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload images d'abord
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        toast.info('📤 Upload des images en cours...')
        imageUrls = await uploadImages(user.id)
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
        images: imageUrls,
        available_from: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available',
      }

      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert([offerData])
        .select()

      if (error) throw error

      setSuccess(true)
      setTimeout(() => router.navigate({ to: '/marketplace' }), 2000)
    } catch (error: any) {
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
            <p className="text-sm text-gray-500">Redirection...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <header className="bg-white border-b border-green-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.navigate({ to: '/marketplace' })}
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
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
                  Remplissez le formulaire pour publier votre produit
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="font-semibold text-gray-700">Titre *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Tomates fraîches - Récolte du jour"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="font-semibold text-gray-700">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre produit..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Images */}
              <div>
                <Label className="font-semibold text-gray-700">Photos du produit (max 5)</Label>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img src={preview} alt={`Aperçu ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors bg-gray-50">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Cliquez pour sélectionner des images
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    JPG, PNG, WEBP — max 5MB par image
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-gray-700">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold text-gray-700">Unité *</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-gray-700">Quantité *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label className="font-semibold text-gray-700">Prix / unité (FCFA) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-gray-700">Localisation (ville) *</Label>
                  <Input
                    placeholder="Ex: Ouagadougou"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label className="font-semibold text-gray-700">Région *</Label>
                  <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Publication en cours...' : 'Publier l\'offre'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}