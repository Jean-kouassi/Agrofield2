import { Link, useLocation } from '@tanstack/react-router'
import { Home, Sprout, Droplets, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const defaultItems: BottomNavItem[] = [
  { to: '/_authenticated/dashboard', label: 'Accueil', icon: <Home size={20} /> },
  { to: '/_authenticated/parcels', label: 'Parcelles', icon: <Sprout size={20} /> },
  { to: '/_authenticated/sensors', label: 'Capteurs', icon: <Droplets size={20} /> },
  { to: '/_authenticated/diagnose', label: 'Diagnostic', icon: <User size={20} /> },
  { to: '/marketplace', label: 'Marketplace', icon: <ShoppingCart size={20} /> },
]

interface BottomNavProps {
  items?: BottomNavItem[]
  className?: string
}

export function BottomNav({ items = defaultItems, className }: BottomNavProps) {
  const location = useLocation()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden',
        className
      )}
      style={{ borderColor: 'var(--agro-border)' }}
    >
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center py-3 px-1 transition-colors',
                isActive ? 'text-green-700 font-semibold' : 'text-gray-500 hover:text-green-600'
              )}
            >
              <div className="mb-1">{item.icon}</div>
              <span className="text-[10px] leading-none truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
