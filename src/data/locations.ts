/**
 * AgroSphere - Localisations Burkina Faso
 * Régions et villes/provinces pour le marketplace
 */

export interface Region {
  id: string
  name: string
  cities: string[]
}

export const BF_REGIONS: Region[] = [
  {
    id: 'centre',
    name: 'Centre',
    cities: ['Ouagadougou'],
  },
  {
    id: 'centre-est',
    name: 'Centre-Est',
    cities: ['Tenkodogo', 'Boulgou', 'Kouritenga', 'Koulpélogo'],
  },
  {
    id: 'centre-nord',
    name: 'Centre-Nord',
    cities: ['Kaya', 'Sanmatenga', 'Namentenga', 'Oubritenga'],
  },
  {
    id: 'centre-ouest',
    name: 'Centre-Ouest',
    cities: ['Koudougou', 'Sanguié', 'Sissili', 'Ziro'],
  },
  {
    id: 'centre-sud',
    name: 'Centre-Sud',
    cities: ['Manga', 'Nahouri', 'Ganzourgou', 'Bazèga'],
  },
  {
    id: 'boucle-du-mouhoun',
    name: 'Boucle du Mouhoun',
    cities: ['Dédougou', 'Balé', 'Banwa', 'Kossi', 'Mouhoun', 'Nayala', 'Sourou'],
  },
  {
    id: 'cascades',
    name: 'Cascades',
    cities: ['Banfora', 'Comoé', 'Léraba'],
  },
  {
    id: 'est',
    name: 'Est',
    cities: ['Fada N\'gourma', 'Gnagna', 'Komondjari', 'Kompienga', 'Tapoa'],
  },
  {
    id: 'hauts-bassins',
    name: 'Hauts-Bassins',
    cities: ['Bobo-Dioulasso', 'Houet', 'Tuy', 'Kénédougou'],
  },
  {
    id: 'nord',
    name: 'Nord',
    cities: ['Ouahigouya', 'Loroum', 'Passoré', 'Yatenga', 'Zondoma'],
  },
  {
    id: 'plateau-central',
    name: 'Plateau-Central',
    cities: ['Ziniaré', 'Oubritenga', 'Kourwéogo'],
  },
  {
    id: 'sahel',
    name: 'Sahel',
    cities: ['Dori', 'Oudalan', 'Séno', 'Soum'],
  },
  {
    id: 'sud-ouest',
    name: 'Sud-Ouest',
    cities: ['Gaoua', 'Bougouriba', 'Ioba', 'Noumbiel', 'Poni'],
  },
]

// Helper: Get all regions as simple array for Select component
export function getRegions(): string[] {
  return BF_REGIONS.map(r => r.name)
}

// Helper: Get cities for a specific region
export function getCitiesByRegion(regionName: string): string[] {
  const region = BF_REGIONS.find(r => r.name === regionName)
  return region?.cities || []
}

// Helper: Get region ID by name
export function getRegionIdByName(name: string): string {
  return BF_REGIONS.find(r => r.name === name)?.id || ''
}

// Helper: Get region name by ID
export function getRegionNameById(id: string): string {
  return BF_REGIONS.find(r => r.id === id)?.name || ''
}

// Export for backwards compatibility
export const REGIONS = getRegions()
