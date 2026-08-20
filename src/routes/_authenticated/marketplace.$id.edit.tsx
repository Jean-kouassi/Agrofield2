import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, Leaf, CheckCircle, Upload, Trash2, Image as ImageIcon,
  AlertCircle, Save, X, MapPin, Tag, Scale, Banknote,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { ProductCategory, UnitType } from '@/types/marketplace'

export const Route = createFileRoute('/_authenticated/marketplace/$id/edit')({
  ssr: false,
  component: EditOfferPage,
})

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'tomates', label: 'Tomates' },
  { value: 'oignons', label: 'Oignons' },
  { value: 'mil', label: 'Mil' },
  { value: 'sorgho', label: 'Sorgho' },
  { value: 'mais', label: 'Maïs' },
  { value: 'niebe', label: 'Niébé' },
  { value: 'arachide', label: 'Arachide' },
  { value: 'coton', label: 'Coton' },
  { value: 'mangue', label: 'Mangue' },
  { value: 'autre', label: 'Autre' },
]

const units: { value: UnitType; label: string }[] = [
  { value: 'kg', label: 'Kilogramme (kg)' },
  { value: 'sac', label: 'Sac' },
  { value: 'panier', label: 'Panier' },
  { value: 'caisse', label: 'Caisse' },
  { value: 'unite', label: 'Unité' },
]

const regions = [
  'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est', 'Centre-Nord', 'Centre-Ouest',
  'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest',
]

function EditOfferPage() {
  const router = useRouter()
  const { id } = Route.useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        toast.error('Vous devez être connecté pour modifier une offre')
        router.navigate({ to: '/auth' })
        return
      }

      const { data: offer, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !offer) {
        toast.error('Offre non trouvée')
        router.navigate({ to: '/marketplace' })
        return
      }

      if (offer.seller_id !== user.id) {
        toast.error('Vous ne pouvez modifier que vos propres offres')
        router.navigate({ to: '/marketplace' })
        return
      }

      setIsOwner(true)
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        category: offer.category as ProductCategory,
        quantity: offer.quantity?.toString() || '',
        unit: offer.unit as UnitType,
        price: offer.price?.toString() || '',
        location: offer.location || '',
        region: offer.region || '',
      })
      setExistingImages(Array.isArray(offer.images) ? (offer.images as string[]) : [])
      setFetching(false)
    }

    loadData()
  }, [id, router])

  // Generate previews for newly selected images
  useEffect(() => {
    const previews = selectedImages.map((file) => URL.createObjectURL(file))
    setImagePreviews(previews)
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [selectedImages])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    // Limit total images to 8
    const remaining = 8 - existingImages.length
    if (remaining <= 0) {
      toast.error('Maximum 8 images par offre')
      return
    }
    setSelectedImages(files.slice(0, remaining))
  }

  function handleRemoveNewImage(idx: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleDeleteImage(imageUrl: string) {
    if (!confirm('Supprimer cette image ?')) return

    setExistingImages((prev) => prev.filter((url) => url !== imageUrl))

    try {
      const path = imageUrl.split('/object/public/marketplace-images/')[1]
      if (path) {
        await supabase.storage.from('marketplace-images').remove([path])
      }
      toast.success('Image supprimée')
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Le titre est requis'
    else if (formData.title.length < 5) newErrors.title = 'Titre trop court (min 5 caractères)'

    if (!formData.description.trim()) newErrors.description = 'La description est requise'
    else if (formData.description.length < 10) newErrors.description = 'Description trop courte (min 10 caractères)'

    if (!formData.category) newErrors.category = 'Catégorie requise'
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = 'Quantité invalide'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Prix invalide'
    if (!formData.location.trim()) newErrors.location = 'Ville requise'
    if (!formData.region) newErrors.region = 'Région requise'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs avant de continuer')
      return
    }

    setLoading(true)
    setUploadingImages(true)

    try {
      let finalImages = [...existingImages]

      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(async (file) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

          const { error } = await supabase.storage
            .from('marketplace-images')
            .upload(`offers/${user.id}/${fileName}`, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('marketplace-images')
            .getPublicUrl(`offers/${user.id}/${fileName}`)

          return publicUrl
        })

        const newUrls = await Promise.all(uploadPromises)
        finalImages = [...finalImages, ...newUrls]
      }

      setUploadingImages(false)

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location.trim(),
        region: formData.region,
        images: finalImages,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('marketplace_listings')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      toast.success('✅ Offre modifiée avec succès !')
      setTimeout(() => router.navigate({ to: '/marketplace/$id', params: { id } }), 1000)
    } catch (err: any) {
      console.error('Error:', err)
      setUploadingImages(false)
      toast.error('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Loading ───
  if (fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Chargement de l'offre...</p>
        </div>
      </div>
    )
  }

  if (!isOwner) return null

  const totalImages = existingImages.length + selectedImages.length

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <button
            onClick={() => router.navigate({ to: '/marketplace/$id', params: { id } })}
            className="inline-flex items-center gap-2 font-medium text-sm text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
            style={{ minHeight: 48 }}
            aria-label="Retour à l'offre"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour à l'offre
          </button>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Leaf className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-xl">Modifier l'offre</CardTitle>
                <CardDescription>Modifiez les informations de votre produit</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Titre *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Ex: Tomates fraîches - Récolte récente"
                  className="h-12"
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                    <AlertCircle className="h-3 w-3" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Décrivez votre produit : qualité, variété, mode de culture..."
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                    <AlertCircle className="h-3 w-3" /> {errors.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* Images existantes */}
              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Images actuelles ({existingImages.length})</Label>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {existingImages.map((url, idx) => (
                      <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                        <img src={url} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(url)}
                          className="absolute right-1 top-1 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                          style={{ minHeight: 36, minWidth: 36 }}
                          aria-label={`Supprimer image ${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouvelles images */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Ajouter des photos ({totalImages}/8)
                </Label>
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="mb-2 text-sm text-muted-foreground">Cliquez pour sélectionner des images</p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                    aria-label="Sélectionner des images"
                  />
                </div>

                {/* Preview new images */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                        <img src={preview} alt={`Nouvelle image ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
                          className="absolute right-1 top-1 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                          style={{ minHeight: 36, minWidth: 36 }}
                          aria-label={`Retirer nouvelle image ${idx + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <Badge variant="secondary" className="absolute bottom-1 left-1 text-[8px]">
                          Nouveau
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Catégorie + Unité */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v as ProductCategory }))}
                  >
                    <SelectTrigger className="h-12" aria-invalid={!!errors.category}>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                      <AlertCircle className="h-3 w-3" /> {errors.category}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Unité *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, unit: v as UnitType }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantité + Prix */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-primary" /> Quantité *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                    className="h-12"
                    placeholder="Ex: 100"
                    aria-invalid={!!errors.quantity}
                  />
                  {errors.quantity && (
                    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                      <AlertCircle className="h-3 w-3" /> {errors.quantity}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-primary" /> Prix / unité (FCFA) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    required
                    className="h-12"
                    placeholder="Ex: 500"
                    aria-invalid={!!errors.price}
                  />
                  {errors.price && (
                    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                      <AlertCircle className="h-3 w-3" /> {errors.price}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Localisation + Région */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Ville *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    required
                    className="h-12"
                    placeholder="Ex: Ouagadougou"
                    aria-invalid={!!errors.location}
                  />
                  {errors.location && (
                    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                      <AlertCircle className="h-3 w-3" /> {errors.location}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Région *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, region: v }))}
                  >
                    <SelectTrigger className="h-12" aria-invalid={!!errors.region}>
                      <SelectValue placeholder="Choisir une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.region && (
                    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                      <AlertCircle className="h-3 w-3" /> {errors.region}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Boutons */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.navigate({ to: '/marketplace/$id', params: { id } })}
                  style={{ minHeight: 48 }}
                  className="sm:flex-1"
                >
                  <X className="mr-2 h-4 w-4" /> Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploadingImages}
                  style={{ minHeight: 48 }}
                  className="sm:flex-[2]"
                >
                  {uploadingImages ? (
                    'Upload des images...'
                  ) : loading ? (
                    'Enregistrement...'
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}