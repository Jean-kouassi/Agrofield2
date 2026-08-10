import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useState } from 'react'
import { REGIONS } from '@/lib/marketplace-data'
import { cn } from '@/lib/utils'

export interface FilterValues {
  priceMin: string
  priceMax: string
  region: string
  availability: string
  saleType: string
}

interface FilterDrawerProps {
  filters: FilterValues
  setFilters: (f: FilterValues) => void
  onClose: () => void
  onApply: (f: FilterValues) => void
}

export function FilterDrawer({ filters, setFilters, onClose, onApply }: FilterDrawerProps) {
  const [local, setLocal] = useState(filters)

  function update(field: keyof FilterValues, value: string) {
    setLocal((l) => ({ ...l, [field]: value }))
  }

  function reset() {
    const resetValues = {
      priceMin: '',
      priceMax: '',
      region: 'all',
      availability: 'all',
      saleType: 'all',
    }
    setLocal(resetValues)
    setFilters(resetValues)
  }

  return (
    <Drawer open onOpenChange={onClose}>
      <DrawerContent className="af-bottom-sheet">
        <DrawerHeader className="border-b">
          <DrawerTitle className="af-display flex items-center justify-between">
            Filtres avancés
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 flex flex-col gap-5">
          <div>
            <Label className="text-sm font-semibold block mb-2">Gamme de prix (FCFA)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={local.priceMin}
                onChange={(e) => update('priceMin', e.target.value)}
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="number"
                placeholder="Max"
                value={local.priceMax}
                onChange={(e) => update('priceMax', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Région</Label>
            <Select value={local.region} onValueChange={(v) => update('region', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les régions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold block mb-2">Disponibilité</Label>
            <div className="flex gap-2">
              {[
                ['all', 'Toutes'],
                ['available', 'Immédiate'],
                ['reserved', 'Précommande'],
              ].map(([v, l]) => (
                <Button
                  key={v}
                  variant="outline"
                  onClick={() => update('availability', v)}
                  className={cn(
                    'af-chip rounded-full px-3.5 py-2 text-sm font-medium',
                    local.availability === v && 'af-chip-active'
                  )}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold block mb-2">Type de vente</Label>
            <div className="flex gap-2">
              {[
                ['all', 'Tous'],
                ['gros', 'Gros'],
                ['detail', 'Détail'],
              ].map(([v, l]) => (
                <Button
                  key={v}
                  variant="outline"
                  onClick={() => update('saleType', v)}
                  className={cn(
                    'af-chip rounded-full px-3.5 py-2 text-sm font-medium',
                    local.saleType === v && 'af-chip-active'
                  )}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <Button variant="outline" onClick={reset} className="flex-1">
            Réinitialiser
          </Button>
          <Button onClick={() => onApply(local)} className="flex-1">
            Appliquer
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
