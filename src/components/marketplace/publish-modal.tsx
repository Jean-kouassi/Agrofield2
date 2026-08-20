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
import { X, Check, MapPin, ImagePlus, Navigation } from 'lucide-react'
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

const STEP_LABELS = ['Infos', 'Prix', 'Localisation', 'Photos', 'Résumé']

export function PublishModal({ onClose, onPublish }: PublishModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [geoLocationOpen, setGeoLocationOpen] = useState(false)
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number; address?: string; accuracy?: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
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
      5 - imageFiles.length
    )
    
    // Store actual File objects for upload
    setImageFiles(prev => [...prev, ...files].slice(0, 5))
    
    // Also create previews for UI
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
    if (step === 3) {
      // Localisation OBLIGATOIRE - ville + coordonnées GPS requises
      if (!data.city || !availableCities.includes(data.city)) return false
      if (!geoCoords) return false // GPS obligatoire comme WhatsApp
      return true
    }
    return true
  }, [step, data, availableCities, geoCoords])

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
        images: [], // Will be replaced by uploaded URLs
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // Coordonnées GPS pour les livreurs
        latitude: geoCoords?.latitude || null,
        longitude: geoCoords?.longitude || null,
        location_address: geoCoords?.address || null,
        // Pass actual files for upload
        imageFiles: imageFiles,
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
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b">
          <DialogTitle className="af-display flex items-center justify-between">
            Publier une offre
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </DialogTitle>

          <div className="flex items-center gap-1 mt-2">
            {STEP_LABELS.map((label, i) => (
              <Fragment key={label}>
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200"
                    style={{
                      background:
                        i + 1 <= step ? '#166534' : '#e2e8e0',
                      color: i + 1 <= step ? '#fff' : '#64748b',
                      boxShadow: i + 1 === step ? '0 0 0 2px rgba(22,101,52,0.2)' : 'none',
                      border: i + 1 === step ? '1.5px solid #166534' : '1.5px solid transparent',
                    }}
                  >
                    {i + 1 < step ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className="hidden sm:block text-[9px] font-semibold transition-all duration-200"
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
                  <div className="flex-1 h-1 bg-gray-200 rounded-full mx-0.5 overflow-hidden">
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

        <div className="px-4 py-3 flex flex-col gap-3">
          {step === 1 && (
            <>
              <div>
                <Label className="text-xs font-semibold">
                  Titre{' '}
                  <span className="text-muted-foreground">({data.title.length}/100)</span>
                </Label>
                <Input
                  maxLength={100}
                  value={data.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Ex : Tomates fraîches"
                  className="h-9 mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Catégorie</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon
                    return (
                      <Button
                        key={c.id}
                        variant="outline"
                        onClick={() => set('category', c.id)}
                        className={cn(
                          'rounded-md px-2 py-2 text-xs font-medium inline-flex items-center gap-1.5 border-2 transition-all duration-200',
                          data.category === c.id
                            ? 'bg-green-700 border-green-800 text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300'
                        )}
                      >
                        <Icon size={14} /> {c.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  Description{' '}
                  <span className="text-muted-foreground">(min. 20)</span>
                </Label>
                <Textarea
                  rows={3}
                  value={data.desc}
                  onChange={(e) => set('desc', e.target.value)}
                  placeholder="Qualité, fraîcheur, stockage..."
                  className="h-auto min-h-[60px] mt-1 resize-none text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Type de vente</Label>
                <div className="flex gap-2 mt-1">
                  {[
                    ['gros', 'Gros'],
                    ['detail', 'Détail'],
                  ].map(([v, l]) => (
                    <Button
                      key={v}
                      variant="outline"
                      onClick={() => set('saleType', v as 'gros' | 'detail')}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium flex-1 border-2 transition-all duration-200',
                        data.saleType === v
                          ? 'bg-green-700 border-green-800 text-white shadow-md'
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Prix (FCFA)</Label>
                  <Input
                    type="number"
                    value={data.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="250"
                    className="h-9 mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Unité</Label>
                  <select
                    value={data.unit}
                    onChange={(e) => set('unit', e.target.value)}
                    className="h-9 rounded-md px-2 py-1.5 text-sm w-full mt-1 border border-gray-300"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  Quantité ({data.unit || 'unité'})
                </Label>
                <Input
                  type="number"
                  value={data.qty}
                  onChange={(e) => set('qty', e.target.value)}
                  placeholder="500"
                  className="h-9 mt-1 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Min. commande</Label>
                <Input
                  type="number"
                  value={data.minOrder}
                  onChange={(e) => set('minOrder', e.target.value)}
                  placeholder="10"
                  className="h-9 mt-1 text-sm"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-2.5">
              {/* Région */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Région *</Label>
                <select
                  value={data.region}
                  onChange={(e) => set('region', e.target.value)}
                  className="h-9 rounded-md px-2 py-1.5 text-sm w-full border border-gray-300"
                >
                  {BF_REGIONS.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Ville */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Ville *</Label>
                <select
                  value={data.city}
                  onChange={(e) => set('city', e.target.value)}
                  className="h-9 rounded-md px-2 py-1.5 text-sm w-full border border-gray-300"
                  disabled={!data.region || availableCities.length === 0}
                >
                  <option value="">
                    {data.region ? "Choisir une ville" : "Région d'abord"}
                  </option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Géolocalisation OBLIGATOIRE - Compact */}
              <div className="mt-3 p-3 border-2 border-dashed rounded-lg bg-green-50/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <h4 className="font-bold text-green-800 text-xs">📍 GPS (Obligatoire)</h4>
                </div>
                
                {geoCoords ? (
                  <div className="space-y-2">
                    <div className="p-2 bg-green-100 border border-green-300 rounded-md">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-green-900 mb-0.5">✅ Position OK</p>
                          <p className="text-[10px] font-mono text-green-700 truncate">
                            {geoCoords.latitude.toFixed(5)}, {geoCoords.longitude.toFixed(5)}
                          </p>
                          {geoCoords.address && (
                            <p className="text-[10px] text-green-700 mt-0.5 line-clamp-1">
                              {geoCoords.address}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setGeoCoords(null)
                            setGeoError(null)
                          }}
                          className="text-green-600 hover:text-green-700 shrink-0 h-6 w-6"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                      
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${geoCoords.latitude}&mlon=${geoCoords.longitude}#map=16/${geoCoords.latitude}/${geoCoords.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] text-green-700 hover:underline mt-1"
                      >
                        🗺️ Carte
                      </a>
                    </div>
                    
                    <p className="text-[10px] text-green-700 font-medium">
                      ✅ Visible par les livreurs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={() => setGeoLocationOpen(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-xs font-bold rounded-md shadow-md h-auto"
                    >
                      <Navigation className="w-4 h-4 mr-1.5" />
                      Activer GPS
                    </Button>
                    
                    {geoError && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-md text-[10px] text-red-700">
                        ⚠️ {geoError}
                      </div>
                    )}
                    
                    <div className="text-[10px] text-gray-600 space-y-0.5">
                      <p className="font-semibold">💡 Pourquoi :</p>
                      <ul className="list-disc list-inside space-y-0 ml-1">
                        <li>Trouver facilement</li>
                        <li>Position exacte</li>
                        <li>Confiance acheteurs</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <>
              <Label className="text-xs font-semibold">Photos (max 5)</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {data.images.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-md overflow-hidden"
                  >
                    <img src={src} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() =>
                        set(
                          'images',
                          data.images.filter((_, idx) => idx !== i)
                        )
                      }
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
                    >
                      <X size={10} color="#fff" />
                    </button>
                  </div>
                ))}
                {data.images.length < 5 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-0.5 text-[10px]"
                    style={{ borderColor: 'var(--agro-border)', color: 'var(--agro-muted)' }}
                  >
                    <ImagePlus size={16} /> Ajouter
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
            </>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-2">
              <div className="rounded-lg overflow-hidden border">
                {data.images[0] && (
                  <img src={data.images[0]} className="w-full h-32 object-cover" alt="" />
                )}
                <div className="p-3 flex flex-col gap-1.5">
                  <CategoryBadge category={data.category} />
                  <h4 className="font-bold text-sm line-clamp-2">
                    {data.title || 'Titre'}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{data.desc}</p>
                  <div className="text-base font-extrabold text-primary">
                    {data.price ? fcfa(Number(data.price)) : '—'}
                    <span className="text-xs font-normal text-muted-foreground"> / {data.unit}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.qty} {data.unit} · min. {data.minOrder}
                  </div>
                  <div className="text-xs inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin size={10} /> {data.city}, {data.region}
                  </div>
                  
              {geoCoords && (
                    <div className="mt-1 pt-1 border-t">
                      <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">
                        <Navigation size={8} />
                        GPS: {geoCoords.latitude.toFixed(3)}, {geoCoords.longitude.toFixed(3)}
                        {geoCoords.accuracy && (
                          <span className="ml-1">
                            ({Math.round(geoCoords.accuracy)}m)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                Vérifiez avant de publier.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-4 py-3 border-t flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={loading}
              className="rounded-md px-4 text-sm font-semibold h-9 border-gray-300 hover:bg-gray-100"
            >
              Préc.
            </Button>
          )}
          {step < 5 ? (
            <Button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext || loading}
              className="bg-green-700 hover:bg-green-800 text-white flex-1 rounded-md font-semibold h-9 shadow-sm"
            >
              Continuer
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={loading}
              className="bg-green-700 hover:bg-green-800 text-white flex-1 rounded-md font-semibold h-9 shadow-sm"
            >
              {loading ? 'Publication...' : 'Publier'}
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
