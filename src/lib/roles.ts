import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { Leaf, Truck, Store, Users, Sprout } from 'lucide-react'

export type AppRole = Database['public']['Enums']['app_role']

export const ONBOARDING_ROLES = [
  {
    id: 'producer' as AppRole,
    label: 'Agriculteur-Producteur',
    icon: Leaf,
    description: 'Je cultive des parcelles et je vends ma production',
    color: 'var(--agro-primary)',
  },
  {
    id: 'wholesaler' as AppRole,
    label: 'Acheteur Grossiste',
    icon: Truck,
    description: "J'achète en gros volume pour redistribution",
    color: '#2563eb',
  },
  {
    id: 'retailer' as AppRole,
    label: 'Acheteur Détaillant',
    icon: Store,
    description: "J'achète pour revendre au détail",
    color: '#d97706',
  },
  {
    id: 'cooperative_manager' as AppRole,
    label: 'Gestionnaire Coopérative',
    icon: Users,
    description: 'Je gère une coopérative agricole',
    color: '#7c3aed',
  },
] as const

export interface NavItem {
  to: string
  label: string
  icon: string
  roles: AppRole[]
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Accueil', icon: 'Home', roles: ['producer', 'wholesaler', 'retailer', 'admin', 'cooperative_manager'] },
  { to: '/parcels', label: 'Parcelles', icon: 'Sprout', roles: ['producer', 'admin', 'cooperative_manager'] },
  { to: '/sensors', label: 'Capteurs', icon: 'Droplets', roles: ['producer', 'admin', 'cooperative_manager'] },
  { to: '/diagnose', label: 'Diagnostic', icon: 'Microscope', roles: ['producer', 'admin'] },
  { to: '/marketplace', label: 'Marketplace', icon: 'ShoppingCart', roles: ['producer', 'wholesaler', 'retailer', 'admin', 'cooperative_manager'] },
  { to: '/finances', label: 'Finances', icon: 'Wallet', roles: ['producer', 'wholesaler', 'retailer', 'admin'] },
  { to: '/finances/credit', label: 'Crédit', icon: 'CreditCard', roles: ['producer', 'wholesaler', 'retailer', 'admin'] },
]

export function getNavForRole(role: AppRole | null): NavItem[] {
  if (!role) return NAV_ITEMS
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function canAccessPage(page: string, role: AppRole | null): boolean {
  const item = NAV_ITEMS.find((n) => n.to === page)
  if (!item) return true // Pages non listées = accès libre
  if (!role) return true // Rôle non défini = accès libre (dev)
  return item.roles.includes(role)
}

export function getDefaultRoute(role: AppRole | null): string {
  if (!role) return '/dashboard'
  switch (role) {
    case 'admin':
      return '/dashboard'
    case 'cooperative_manager':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

export function getRoleLabel(role: AppRole): string {
  switch (role) {
    case 'producer':
      return 'Producteur'
    case 'wholesaler':
      return 'Grossiste'
    case 'retailer':
      return 'Détaillant'
    case 'admin':
      return 'Administrateur'
    case 'cooperative_manager':
      return 'Gestionnaire de coopérative'
    default:
      return 'Utilisateur'
  }
}

export function getRoleIcon(role: AppRole): string {
  switch (role) {
    case 'producer':
      return '🌾'
    case 'wholesaler':
      return '📦'
    case 'retailer':
      return '🛒'
    case 'admin':
      return '⚙️'
    case 'cooperative_manager':
      return '🏛️'
    default:
      return '👤'
  }
}

export function getRoleColor(role: AppRole): string {
  switch (role) {
    case 'producer':
      return 'var(--agro-primary)'
    case 'wholesaler':
      return '#2563eb'
    case 'retailer':
      return '#d97706'
    case 'admin':
      return '#dc2626'
    case 'cooperative_manager':
      return '#7c3aed'
    default:
      return 'var(--agro-muted)'
  }
}

export function useUserRole(): AppRole | null {
  const { data } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (error || !profile) return null
      return profile.role as AppRole
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

  return data ?? null
}