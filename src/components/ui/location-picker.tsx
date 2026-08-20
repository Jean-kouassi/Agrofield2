import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface LocationPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (location: { latitude: number; longitude: number; address?: string }) => void
}

interface Position {
  latitude: number
  longitude: number
  accuracy?: number
}

export function LocationPicker({ open, onOpenChange, onSelect }: LocationPickerProps) {
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [address, setAddress] = useState('')

  // Get current location using Geolocation API - WhatsApp style with HIGH ACCURACY
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
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }
        setPosition({ latitude: coords.latitude, longitude: coords.longitude })
        
        // Reverse geocoding avec Nominatim (gratuit)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`)
          .then(res => res.json())
          .then(data => {
            if (data.display_name) {
              const shortAddress = data.display_name.split(',').slice(0, 4).join(',')
              setAddress(shortAddress)
            }
          })
          .catch(() => {})
        
        setLoading(false)
        
        // Afficher la précision
        const accuracyText = Math.round(coords.accuracy) < 50 
          ? `Précision excellente (${Math.round(coords.accuracy)}m)`
          : Math.round(coords.accuracy) < 200
            ? `Bonne précision (${Math.round(coords.accuracy)}m)`
            : `Précision moyenne (${Math.round(coords.accuracy)}m) - Attendez quelques secondes pour améliorer`;
        
        toast.success(`📍 Position trouvée - ${accuracyText}`)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setLoading(false)
        
        let errorMsg = 'Impossible de récupérer votre position'
        if (err.code === 1) {
          errorMsg = 'Accès GPS refusé. Veuillez autoriser la localisation dans votre navigateur.'
        } else if (err.code === 2) {
          errorMsg = 'GPS indisponible. Activez la localisation sur votre appareil.'
        } else if (err.code === 3) {
          errorMsg = 'Délai dépassé. Réessayez en vous plaçant à ciel ouvert.'
        }
        
        toast.error('❌ ' + errorMsg)
      },
      {
        enableHighAccuracy: true,   // GPS haute précision OBLIGATOIRE
        timeout: 30000,             // 30 secondes max (plus long pour meilleure précision)
        maximumAge: 0               // Toujours une position fraîche, jamais de cache
      }
    )
  }

  function handleConfirm() {
    if (!position) {
      toast.error('Veuillez d\'abord activer votre position GPS')
      return
    }

    onSelect({
      latitude: position.latitude,
      longitude: position.longitude,
      address: address || undefined
    })
    
    onOpenChange(false)
    toast.success('✅ Localisation enregistrée pour les livreurs')
  }

  // Auto-open GPS quand la modale s'ouvre
  useEffect(() => {
    if (open && !position) {
      getCurrentLocation()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // Reset on close
        setPosition(null)
        setAddress('')
      }
      onOpenChange(isOpen)
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            📍 Ma position exacte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status message */}
          {loading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">Recherche du signal GPS...</p>
              <p className="text-xs text-blue-600 mt-1">Restez à ciel ouvert si possible</p>
            </div>
          )}

          {/* Position found */}
          {position && (
            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-900">✅ Position détectée !</p>
                  <p className="text-xs font-mono text-green-700 mt-0.5">
                    {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                  </p>
                  
                  {/* Précision affichée */}
                  {position.accuracy && (
                    <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${
                      Math.round(position.accuracy) < 50 ? 'bg-green-200 text-green-800' :
                      Math.round(position.accuracy) < 200 ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      📏 Précision: ~{Math.round(position.accuracy)}m
                      {Math.round(position.accuracy) < 50 && ' ✅ Excellente'}
                      {Math.round(position.accuracy) >= 50 && Math.round(position.accuracy) < 200 && ' ⚠️ Bonne'}
                      {Math.round(position.accuracy) >= 200 && ' ❌ Moyenne - Réessayez'}
                    </div>
                  )}
                  
                  {address && (
                    <p className="text-xs text-green-700 mt-2 line-clamp-2">
                      📍 {address}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Open in map */}
              <a
                href={`https://www.openstreetmap.org/?mlat=${position.latitude}&mlon=${position.longitude}#map=17/${position.latitude}/${position.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs font-semibold text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 py-2 rounded transition-colors"
              >
                🗺️ Voir sur la carte interactive
              </a>
            </div>
          )}

          {/* Instructions */}
          {!position && !loading && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-bold text-amber-900 mb-2">💡 Pour une précision maximale :</p>
              <ol className="text-xs text-amber-800 space-y-1.5 list-decimal list-inside">
                <li><strong>Sortez à l'extérieur</strong> (loin des bâtiments)</li>
                <li><strong>Activez le GPS</strong> de votre appareil</li>
                <li>Cliquez sur le bouton ci-dessous</li>
                <li>Autorisez l'accès au GPS</li>
                <li><strong>Attendez 10-30 secondes</strong> sans bouger</li>
                <li>La position sera très précise (&lt;50m)</li>
              </ol>
              <p className="text-xs text-amber-700 mt-3 font-semibold">
                ⚠️ Important : Si la précision est &gt;200m, réessayez en étant plus près d'une fenêtre ou dehors.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!position || loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3"
            size="lg"
          >
            {position ? '✅ Confirmer' : '⏳ En attente...'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
