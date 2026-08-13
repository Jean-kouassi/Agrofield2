import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Navigation, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface LocationPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (location: { latitude: number; longitude: number; address?: string }) => void
}

interface Position {
  latitude: number
  longitude: number
}

export function LocationPicker({ open, onOpenChange, onSelect }: LocationPickerProps) {
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [address, setAddress] = useState('')
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' })

  // Get current location using Geolocation API
  function getCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('❌ La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }

    setLoading(true)
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }
        setPosition(coords)
        setManualCoords({
          lat: coords.latitude.toFixed(6),
          lng: coords.longitude.toFixed(6)
        })
        
        // Reverse geocoding (optionnel - utilise OpenStreetMap Nominatim)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`)
          .then(res => res.json())
          .then(data => {
            if (data.display_name) {
              setAddress(data.display_name.split(',').slice(0, 3).join(','))
            }
          })
          .catch(() => {})
        
        setLoading(false)
        toast.success('📍 Position récupérée avec succès!')
      },
      (err) => {
        console.error('Geolocation error:', err)
        setLoading(false)
        
        let errorMsg = '❌ Impossible de récupérer votre position'
        if (err.code === 1) {
          errorMsg = '❌ Vous avez refusé l\'accès à la localisation. Veuillez l\'autoriser.'
        } else if (err.code === 2) {
          errorMsg = '❌ Position indisponible. Vérifiez que le GPS est activé.'
        }
        
        toast.error(errorMsg)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  function handleUseCurrentLocation() {
    getCurrentLocation()
  }

  function handleManualCoords() {
    if (!manualCoords.lat || !manualCoords.lng) {
      toast.error('Veuillez remplir les deux coordonnées')
      return
    }

    const lat = parseFloat(manualCoords.lat)
    const lng = parseFloat(manualCoords.lng)

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Coordonnées invalides')
      return
    }

    setPosition({ latitude: lat, longitude: lng })
    toast.success('📍 Coordonnées définies')
  }

  function handleConfirm() {
    if (!position) {
      toast.error('Veuillez sélectionner une position')
      return
    }

    onSelect({
      latitude: position.latitude,
      longitude: position.longitude,
      address: address || undefined
    })
    
    onOpenChange(false)
    toast.success('✅ Localisation enregistrée')
  }

  function resetLocation() {
    setPosition(null)
    setAddress('')
    setManualCoords({ lat: '', lng: '' })
  }

  // Auto-get location when modal opens
  useEffect(() => {
    if (open && !position) {
      // Optional: auto-get location when opening
      // getCurrentLocation()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Ajouter ma localisation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Button to get current location */}
          <Button
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Récupération en cours...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 mr-2" />
                Utiliser ma position actuelle (GPS)
              </>
            )}
          </Button>

          {/* Display current position */}
          {position && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800">📍 Position détectée</p>
                  <p className="text-xs text-green-600 font-mono mt-1">
                    {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                  </p>
                  {address && (
                    <p className="text-xs text-green-700 mt-2">{address}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetLocation}
                  className="text-green-600 hover:text-green-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Open in OpenStreetMap */}
              <a
                href={`https://www.openstreetmap.org/?mlat=${position.latitude}&mlon=${position.longitude}#map=16/${position.latitude}/${position.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-green-700 hover:underline text-center"
              >
                🗺️ Voir sur la carte
              </a>
            </div>
          )}

          {/* Manual coordinates input */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Ou entrer manuellement :</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="lat" className="text-xs">Latitude</Label>
                <Input
                  id="lat"
                  placeholder="12.368893"
                  value={manualCoords.lat}
                  onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                  onBlur={handleManualCoords}
                />
              </div>
              <div>
                <Label htmlFor="lng" className="text-xs">Longitude</Label>
                <Input
                  id="lng"
                  placeholder="-1.520681"
                  value={manualCoords.lng}
                  onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
                  onBlur={handleManualCoords}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Ex: Ouagadougou ≈ 12.3689, -1.5207
            </p>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <strong>💡 Comment ça marche ?</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Cliquez sur "Utiliser ma position" pour activer le GPS</li>
              <li>Autorisez l'accès à la localisation quand demandé</li>
              <li>Votre position sera automatiquement détectée</li>
              <li>Vous pouvez aussi entrer les coordonnées manuellement</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!position}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Confirmer la position
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
