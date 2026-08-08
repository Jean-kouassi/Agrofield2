import { Link, useLocation } from '@tanstack/react-router'
import { Home, Package, ShoppingBag, MessageCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Accueil',
    icon: <Home className="w-5 h-5" />,
  },
  {
    to: '/marketplace/my-offers',
    label: 'Mes offres',
    icon: <Package className="w-5 h-5" />,
  },
  {
    to: '/marketplace/orders',
    label: 'Commandes',
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  {
    to: '/marketplace/messages',
    label: 'Messages',
    icon: <MessageCircle className="w-5 h-5" />,
  },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <>
      {/* Bottom Navigation Bar - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 md:hidden">
        <div className="grid grid-cols-4 gap-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center py-3 px-2 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <div className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive && 'bg-primary/10'
                )}>
                  {item.icon}
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Navigation - Hidden on mobile */}
      <nav className="hidden md:flex items-center gap-4 bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
        <Link 
          to="/"
          className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-80 transition-opacity"
        >
          <Home className="w-5 h-5" />
          <span>AgroField</span>
        </Link>
        
        <div className="flex items-center gap-1 ml-auto">
          {navItems.slice(0, 3).map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

/**
 * FAB (Floating Action Button) pour "Publier une offre"
 * Positionné au centre de la BottomNav sur mobile
 */
export function PublishFab() {
  return (
    <Link
      to="/marketplace/create"
      className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50"
    >
      <button
        className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
        aria-label="Publier une offre"
      >
        <Plus className="w-6 h-6 md:w-7 md:h-7" />
      </button>
    </Link>
  )
}

/**
 * Safe area padding pour les appareils avec notch/home indicator
 */
declare global {
  interface CSSPropertyRegistry {
    '--pb-safe': string
  }
}
