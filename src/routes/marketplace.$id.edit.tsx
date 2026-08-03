import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Leaf, CheckCircle, Upload, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { ProductCategory, UnitType } from '@/types/marketplace'

export const Route = createFileRoute('/marketplace/$id/edit')({
  ssr: false,
  component: EditOfferPage,
})

const categories: ProductCategory[] = [
  'tomates', 'oignons', 'mil', 'sorgho', 'mais', 'niebe', 'arachide', 'coton', 'mangue', 'autre'
]

const units: UnitType[] = ['kg', 'sac', 'panier', 'caisse', 'unite']

const regions = [
  'Centre', 'Boucle du Mouhoun', 'Cascades', 'Centre-Est', 'Centre-Nord', 'Centre-Ouest',
  'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord', 'Plateau-Central', 'Sahel', 'Sud-Ouest'
]

function EditOfferPage() {
  const router = useRouter()
  const { id } = Route.useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)

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
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

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
        title: offer.title,
        description: offer.description,
        category: offer.category as ProductCategory,
        quantity: offer.quantity.toString(),
        unit: offer.unit as UnitType,
        price: offer.price.toString(),
        location: offer.location,
        region: offer.region,
      })
      setExistingImages(Array.isArray(offer.images) ? offer.images : [])
      setFetching(false)
    }

    loadData()
  }, [id])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setSelectedImages(files)
  }

  async function handleDeleteImage(imageUrl: string) {
    if (!confirm('Supprimer cette image ?')) return

    setExistingImages((prev) => prev.filter((url) => url !== imageUrl))
    setImagesToDelete((prev) => [...prev, imageUrl])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
        title: formData.title,
        description: formData.description,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price: parseFloat(formData.price),
        location: formData.location,
        region: formData.region,
        images: finalImages,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('marketplace_listings')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      toast.success('Offre modifiée avec succès !')
      setTimeout(() => router.navigate({ to: '/marketplace/$id', params: { id } }), 1500)
    } catch (err: any) {
      console.error('Error:', err)
      setUploadingImages(false)
      toast.error('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isOwner) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <button
            onClick={() => router.navigate({ to: '/marketplace/$id', params: { id } })}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'offre
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Leaf className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Modifier l'offre</CardTitle>
                <CardDescription>Modifiez les informations de votre produit</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  className="mt-1.5"
                />
              </div>

              {/* Images existantes */}
              {existingImages.length > 0 && (
                <div>
                  <Label>Images actuelles</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {existingImages.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border">
                        <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(url)}
                          className="absolute top-1 right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouvelles images */}
              <div>
                <Label>Ajouter des photos</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-muted/30">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Cliquez pour sélectionner des images</p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                  />
                  {selectedImages.length > 0 && (
                    <p className="mt-2 text-sm text-primary">{selectedImages.length} image(s) sélectionnée(s)</p>
                  )}
                </div>
              </div>

              {/* Catégorie + Unité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v as ProductCategory }))}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unité *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, unit: v as UnitType }))}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
                <div>
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Prix / unité (FCFA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Localisation + Région */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Ville *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Région *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, region: v }))}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={loading || uploadingImages}>
                  {uploadingImages ? 'Upload en cours...' : loading ? 'Enregistrement...' : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.navigate({ to: '/marketplace/$id', params: { id } })}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}