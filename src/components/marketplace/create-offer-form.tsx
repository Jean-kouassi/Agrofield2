import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Leaf, CheckCircle, Upload, X, AlertCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { ProductCategory, UnitType } from '@/types/marketplace'

interface CreateOfferFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const CATEGORIES: ProductCategory[] = [
  'tomates', 'oignons', 'mil', 'sorgho', 'mais', 'niebe', 'arachide', 'coton', 'mangue', 'autre'
]

const UNITS: UnitType[] = ['kg', 'sac', 'panier', 'caisse', 'unite']

const REGIONS = [
  'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est', 'Centre-Nord', 'Centre-Ouest',
  'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'
]

export function CreateOfferForm({ onSuccess, onCancel }: CreateOfferFormProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

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

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast.error('❌ Vous devez être connecté')
        router.navigate({ to: '/auth' })
        return
      }
      console.log('[CreateOfferForm] User authenticated:', { id: user.id, email: user.email })
      setUser(user)
    })
  }, [router])

  // Image handling
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const validFiles = files
      .filter(f => f.size <= 5 * 1024 * 1024)
      .slice(0, 5 - selectedImages.length)
    
    if (validFiles.length < files.length) {
      toast.warning('Certaines images ont été ignorées (max 5 images, 5MB chacune)')
    }

    setSelectedImages(prev => [...prev, ...validFiles])
    
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

  // Image upload
  async function uploadImages(userId: string): Promise<string[]> {
    if (selectedImages.length === 0) return []

    const uploadPromises = selectedImages.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      try {
        const { data, error } = await supabase.storage
          .from('marketplace-images')
          .upload(`offers/${userId}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Upload error:', error)
          throw error
        }

        const { data: { publicUrl } } = supabase.storage
          .from('marketplace-images')
          .getPublicUrl(`offers/${userId}/${fileName}`)

        return publicUrl
      } catch (err: any) {
        console.error('Failed to upload image:', err.message)
        throw err
      }
    })

    return Promise.all(uploadPromises)
  }

  // Form validation
  function validateForm(): string[] {
    const errors: string[] = []
    
    if (!formData.title || formData.title.trim().length < 3) {
      errors.push('Titre trop court (min 3 caractères)')
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.push('Description trop courte (min 10 caractères)')
    }
    if (!formData.category) {
      errors.push('Catégorie requise')
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.push('Quantité invalide')
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Prix invalide')
    }
    if (!formData.location || formData.location.trim().length < 2) {
      errors.push('Localisation requise')
    }
    if (!formData.region) {
      errors.push('Région requise')
    }
    
    return errors
  }

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user || !user.id) {
      toast.error('❌ Utilisateur non connecté')
      router.navigate({ to: '/auth' })
      return
    }

    const errors = validateForm()
    if (errors.length > 0) {
      toast.error('❌ ' + errors.join(', '))
      return
    }

    setLoading(true)

    try {
      // Upload images
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        toast.info('📤 Upload des images en cours...')
        imageUrls = await uploadImages(user.id)
        toast.success(`${imageUrls.length} image(s) uploadée(s)`)
      }

      const offerData = {
        seller_id: user.id,
        seller_name: user.user_metadata?.full_name || user.email || 'Agriculteur',
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location.trim(),
        region: formData.region,
        images: imageUrls,
        available_from: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'available' as const,
      }

      console.log('[CreateOfferForm] Inserting offer:', offerData)

      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert([offerData])
        .select()

      if (error) {
        console.error('[CreateOfferForm] Supabase error:', error)
        throw error
      }

      console.log('[CreateOfferForm] Offer created:', data)
      setSuccess(true)
      toast.success('✅ Offre publiée avec succès !')
      
      if (onSuccess) {
        setTimeout(onSuccess, 2000)
      } else {
        setTimeout(() => router.navigate({ to: '/marketplace' }), 2000)
      }
    } catch (error: any) {
      console.error('[CreateOfferForm] Error:', error)
      const errorMsg = error.message || 'Erreur inconnue'
      toast.error(`❌ Erreur lors de la publication: ${errorMsg}`)
      
      // Help debug common errors
      if (errorMsg.includes('bucket')) {
        toast.error('⚠️ Le bucket marketplace-images n\'existe pas. Contacte l\'admin.')
      } else if (errorMsg.includes('policy')) {
        toast.error('⚠️ Problème de permissions. Vérifie les policies RLS.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Success view
  if (success) {
    return (
      <Card className="max-w-md w-full mx-auto text-center">
        <CardContent className="pt-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Offre publiée avec succès ! 🎉</h2>
          <p className="text-gray-600 mb-4">Votre produit sera bientôt visible sur le marketplace.</p>
          <Button onClick={onSuccess || (() => router.navigate({ to: '/marketplace' }))}>
            Retour au marketplace
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Form view
  return (
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
          {/* Title */}
          <div>
            <Label htmlFor="title" className="font-semibold text-gray-700">Titre *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Tomates fraîches - Récolte du jour"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="font-semibold text-gray-700">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Décrivez votre produit (qualité, variété, mode de culture...)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Images */}
          <div>
            <Label htmlFor="product-images" className="font-semibold text-gray-700 block mb-2">
              Photos du produit (max 5)
            </Label>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                    <img src={preview} alt={`Aperçu ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      aria-label="Supprimer l'image"
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
                id="product-images"
                name="product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="cursor-pointer"
                aria-label="Sélectionner des images du produit"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="font-semibold text-gray-700">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as ProductCategory })}>
                <SelectTrigger id="category" aria-label="Choisir la catégorie">
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
              <Label htmlFor="unit" className="font-semibold text-gray-700">Unité *</Label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as UnitType })}>
                <SelectTrigger id="unit" aria-label="Choisir l'unité">
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

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity" className="font-semibold text-gray-700">Quantité *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="price" className="font-semibold text-gray-700">Prix unitaire (FCFA) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Location & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location" className="font-semibold text-gray-700">Localisation *</Label>
              <Input
                id="location"
                name="location"
                placeholder="Ex: Ouagadougou, Bobo-Dioulasso..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="region" className="font-semibold text-gray-700">Région *</Label>
              <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                <SelectTrigger id="region" aria-label="Choisir la région">
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

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              size="lg"
              className="bg-green-600 hover:bg-green-700 flex-1"
              disabled={loading || !user}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">📤</span>
                  Publication en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Publier l'offre
                </>
              )}
            </Button>
            <Button 
              type="button"
              variant="outline"
              size="lg"
              onClick={onCancel || (() => router.navigate({ to: '/marketplace' }))}
              disabled={loading}
            >
              Annuler
            </Button>
          </div>

          {/* Debug info (dev only) */}
          {process.env.NODE_ENV === 'development' && user && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono space-y-2">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <Button 
                type="button" 
                size="sm" 
                variant="outline"
                onClick={async () => {
                  const { error } = await supabase
                    .from('marketplace_listings')
                    .select('id')
                    .limit(1)
                  if (error) {
                    toast.error('DB Error: ' + error.message)
                    console.error(error)
                  } else {
                    toast.success('✅ DB connection OK')
                  }
                }}
              >
                Test DB Connection
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
