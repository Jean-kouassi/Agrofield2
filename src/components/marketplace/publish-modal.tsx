import { Fragment, useState, useMemo, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Check, MapPin, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORIES,
  REGIONS,
  UNITS,
  type MarketplaceListing,
  CategoryBadge,
  fcfa,
} from '@/lib/marketplace-data'
import { createListing } from '@/lib/marketplace.service'
import { BF_REGIONS, getCitiesByRegion } from '@/data/locations'
import { LocationPicker } from '@/components/ui/location-picker'

interface PublishModalProps {
  onClose: () => void
  onPublish: (data: Partial<MarketplaceListing>) => void
}

const STEP_LABELS = ['Infos', 'Prix & qté', 'Localisation', 'Photos', 'Résumé']

export function PublishModal({ onClose, onPublish }: PublishModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [geoLocationOpen, setGeoLocationOpen] = useState(false)
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number; address?: string } | null>(null)
  const [data, setData] = useState({
    title: '',
    category: 'legumes',
    desc: '',
    saleType: 'gros' as 'gros' | 'detail',
    price: '',
    unit: 'kg',
    qty: '',
    minOrder: '',
    region: BF_REGIONS[0].name,
    city: '',
    images: [] as string[],
  })

  // Update cities when region changes
  useEffect(() => {
    const cities = getCitiesByRegion(data.region)
    setAvailableCities(cities)
    // Reset city if not in new region
    if (data.city && !cities.includes(data.city)) {
      setData(d => ({ ...d, city: '' }))
    }
  }, [data.region])
  const fileRef = useRef<HTMLInputElement | null>(null)

  function set(field: keyof typeof data, value: unknown) {
    setData((d) => ({ ...d, [field]: value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(
      0,
      5 - data.images.length
    )
    const previews = files.map((f) => URL.createObjectURL(f))
    set('images', [...data.images, ...previews].slice(0, 5))
  }

  const canNext = useMemo(() => {
    if (step === 1) return data.title.trim().length > 0 && data.desc.trim().length >= 20
    if (step === 2)
      return (
        Number(data.price) > 0 &&
        Number(data.qty) > 0 &&
        Number(data.minOrder) > 0
      )
    if (step === 3) return data.city.trim().length > 0 && availableCities.includes(data.city)
    return true
  }, [step, data, availableCities])

  async function handlePublish() {
    setLoading(true)
    setError(null)
    
    try {
      const newListing = await createListing({
        title: data.title,
        category: data.category,
        description: data.desc,
        price: Number(data.price) || 0,
        quantity: Number(data.qty) || 0,
        unit: data.unit,
        location: data.city,
        region: data.region,
        images: data.images.length > 0 ? data.images : undefined,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      
      // Pass the created listing to parent (mapped to frontend format)
      onPublish({
        id: newListing.id,
        title: newListing.title,
        category: newListing.category,
        price: newListing.price,
        unit: newListing.unit,
        qty: newListing.qty,
        minOrder: newListing.minOrder,
        region: newListing.region,
        city: newListing.city,
        saleType: data.saleType,
        desc: newListing.desc,
      })
      
      setLoading(false)
    } catch (err: any) {
      console.error('Error publishing listing:', err)
      setError(err.message || 'Erreur lors de la publication')
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="sticky top-0 bg-white z-10 p-4 border-b">
          <DialogTitle className="af-display flex items-center justify-between">
            Publier une offre
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </DialogTitle>

          <div className="flex items-center gap-1.5 mt-3">
            {STEP_LABELS.map((label, i) => (
              <Fragment key={label}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="af-display w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
                    style={{
                      background:
                        i + 1 <= step ? '#166534' : '#e2e8e0',
                      color: i + 1 <= step ? '#fff' : '#64748b',
                      boxShadow: i + 1 === step ? '0 0 0 3px rgba(22,101,52,0.3)' : 'none',
                      border: i + 1 === step ? '2px solid #166534' : '2px solid transparent',
                    }}
                  >
                    {i + 1 < step ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className="af-text-10 hidden sm:block text-xs font-semibold transition-all duration-200"
                    style={{
                      color:
                        i + 1 === step
                          ? '#166534'
                          : i + 1 < step
                            ? '#166534'
                            : '#94a3b8',
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: i + 1 < step ? '100%' : '0%',
                        background: i + 1 < step ? '#166534' : 'transparent'
                      }}
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </DialogHeader>

        <div className="p-5 flex flex-col gap-4">
          {step === 1 && (
            <>
              <div>
                <Label className="text-sm font-semibold">
                  Titre{' '}
                  <span className="text-muted-foreground">({data.title.length}/100)</span>
                </Label>
                <Input
                  maxLength={100}
                  value={data.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Ex : Tomates fraîches de saison"
                  className="af-input mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Catégorie</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon
                    return (
                      <Button
                        key={c.id}
                        variant="outline"
                        onClick={() => set('category', c.id)}
                        className={cn(
                          'rounded-lg px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 border-2 transition-all duration-200',
                          data.category === c.id
                            ? 'bg-green-700 border-green-800 text-white shadow-lg'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300'
                        )}
                      >
                        <Icon size={16} /> {c.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  Description détaillée{' '}
                  <span className="text-muted-foreground">(min. 20 caractères)</span>
                </Label>
                <Textarea
                  rows={4}
                  value={data.desc}
                  onChange={(e) => set('desc', e.target.value)}
                  placeholder="Décrivez la qualité, la fraîcheur, les conditions de stockage..."
                  className="af-input mt-1.5 resize-none"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Type de vente</Label>
                <div className="flex gap-2 mt-1.5">
                  {[
                    ['gros', 'Gros'],
                    ['detail', 'Détail'],
                  ].map(([v, l]) => (
                    <Button
                      key={v}
                      variant="outline"
                      onClick={() => set('saleType', v as 'gros' | 'detail')}
                      className={cn(
                        'rounded-lg px-3.5 py-2.5 text-sm font-medium flex-1 border-2 transition-all duration-200',
                        data.saleType === v
                          ? 'bg-green-700 border-green-800 text-white shadow-lg'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300'
                      )}
                    >
                      {l}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">Prix unitaire (FCFA)</Label>
                  <Input
                    type="number"
                    value={data.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="250"
                    className="af-input mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Unité</Label>
                  <select
                    value={data.unit}
                    onChange={(e) => set('unit', e.target.value)}
                    className="af-input rounded-lg px-3 py-2.5 text-sm w-full mt-1.5"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  Quantité disponible ({data.unit || 'unité'})
                </Label>
                <Input
                  type="number"
                  value={data.qty}
                  onChange={(e) => set('qty', e.target.value)}
                  placeholder="500"
                  className="af-input mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Quantité minimale de commande</Label>
                <Input
                  type="number"
                  value={data.minOrder}
                  onChange={(e) => set('minOrder', e.target.value)}
                  placeholder="10"
                  className="af-input mt-1.5"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Région</Label>
                <select
                  value={data.region}
                  onChange={(e) => set('region', e.target.value)}
                  className="af-input rounded-lg px-3 py-2.5 text-sm w-full"
                >
                  {BF_REGIONS.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ville / village *</Label>
                <select
                  value={data.city}
                  onChange={(e) => set('city', e.target.value)}
                  className="af-input rounded-lg px-3 py-2.5 text-sm w-full"
                  disabled={!data.region || availableCities.length === 0}
                >
                  <option value="">
                    {data.region ? "Choisir une ville" : "Sélectionnez d'abord une région"}
                  </option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {!data.region && (
                  <p className="text-xs text-gray-500 mt-1">Sélectionnez une région d'abord</p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setGeoLocationOpen(true)}
                className="af-btn-ghost rounded-lg py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 w-full border-green-300 text-green-700 hover:bg-green-50"
              >
                <MapPin size={16} />
                {geoCoords ? '📍 Position définie' : 'Ajouter la géolocalisation (optionnel)'}
              </Button>

              {geoCoords && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
                  <p className="font-semibold text-green-800 mb-1">📍 Localisation enregistrée :</p>
                  <p className="text-green-700 font-mono">
                    {geoCoords.latitude.toFixed(6)}, {geoCoords.longitude.toFixed(6)}
                  </p>
                  {geoCoords.address && (
                    <p className="text-green-700 mt-1 truncate">{geoCoords.address}</p>
                  )}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${geoCoords.latitude}&mlon=${geoCoords.longitude}#map=16/${geoCoords.latitude}/${geoCoords.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline block mt-2"
                  >
                    🗺️ Voir sur la carte
                  </a>
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Label className="text-sm font-semibold">Photos (max 5)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {data.images.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <img src={src} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() =>
                        set(
                          'images',
                          data.images.filter((_, idx) => idx !== i)
                        )
                      }
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                    >
                      <X size={12} color="#fff" />
                    </button>
                  </div>
                ))}
                {data.images.length < 5 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs"
                    style={{ borderColor: 'var(--agro-border)', color: 'var(--agro-muted)' }}
                  >
                    <ImagePlus size={20} /> Ajouter
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
              <p className="text-xs text-muted-foreground">
                Glissez-déposez vos photos ou utilisez le bouton ci-dessus.
                Compression automatique à la publication.
              </p>
            </>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-3">
              <div className="af-card rounded-xl overflow-hidden">
                {data.images[0] && (
                  <img src={data.images[0]} className="w-full h-40 object-cover" alt="" />
                )}
                <div className="p-4 flex flex-col gap-2">
                  <CategoryBadge category={data.category} />
                  <h4 className="af-display font-bold text-lg">
                    {data.title || 'Titre de l\'offre'}
                  </h4>
                  <p className="text-sm text-muted-foreground">{data.desc}</p>
                  <div
                    className="af-display text-xl font-extrabold"
                    style={{ color: 'var(--agro-primary)' }}
                  >
                    {data.price ? fcfa(Number(data.price)) : '—'}
                    <span className="text-sm font-normal text-muted-foreground"> / {data.unit}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.qty} {data.unit} disponibles · min. {data.minOrder}{' '}
                    {data.unit}
                  </div>
                  <div className="text-xs inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin size={12} /> {data.city}, {data.region}
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Vérifiez les informations avant publication. Vous pourrez modifier
                l'offre à tout moment depuis "Mes offres".
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={loading}
              className="af-btn-ghost rounded-lg px-5 font-semibold"
            >
              Précédent
            </Button>
          )}
          {step < 5 ? (
            <Button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext || loading}
              className="af-btn-primary flex-1 rounded-lg font-semibold"
            >
              Continuer
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={loading}
              className="af-btn-accent flex-1 rounded-lg font-semibold"
            >
              {loading ? 'Publication...' : 'Publier maintenant'}
            </Button>
          )}
        </div>
        
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
      </DialogContent>

      {/* Location Picker Modal */}
      <LocationPicker
        open={geoLocationOpen}
        onOpenChange={setGeoLocationOpen}
        onSelect={(location) => {
          setGeoCoords(location)
        }}
      />
    </Dialog>
  )
}
