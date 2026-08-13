import { type ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useUserRole, getRoleLabel, type AppRole } from '@/lib/roles'

// ============================================================
// RoleGuard — Protéger une page par rôle
// ============================================================

export function RoleGuard({
  allowedRoles,
  children,
  fallback,
}: {
  allowedRoles: AppRole[]
  children: ReactNode
  fallback?: ReactNode
}) {
  const role = useUserRole()

  if (!role) {
    return (
      fallback ?? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Chargement…</div>
        </div>
      )
    )
  }

  if (!allowedRoles.includes(role)) {
    return (
      fallback ?? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <ShieldAlert className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-bold">Accès non autorisé</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Votre rôle ({getRoleLabel(role)}) n'a pas accès à cette page.
          </p>
        </div>
      )
    )
  }

  return <>{children}</>
}