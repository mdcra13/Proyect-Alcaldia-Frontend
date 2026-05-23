import { useLocation, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  Upload,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import useAuthStore from '@/lib/stores/authStore'

interface MobileNavLink {
  path: string
  label: string
  icon: LucideIcon
}

const alcaldeLinks: MobileNavLink[] = [
  { path: '/alcalde', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/alcalde/pendientes', label: 'Pendientes', icon: ClipboardList },
  { path: '/alcalde/usuarios', label: 'Usuarios', icon: Users },
]

const secretariaLinks: MobileNavLink[] = [
  { path: '/secretaria', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/secretaria/seguimiento', label: 'Solicitudes', icon: FileSearch },
  { path: '/secretaria/subir', label: 'Subir', icon: Upload },
]

function isActiveRoute(currentPath: string, linkPath: string) {
  return currentPath === linkPath
}

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)

  const links = user?.role === 'alcalde' ? alcaldeLinks : secretariaLinks

  return (
    <nav className="mobile-nav lg:hidden" aria-label="Navegacion movil">
      <div className="mobile-nav-inner">
        {links.map(link => {
          const Icon = link.icon
          const isActive = isActiveRoute(location.pathname, link.path)

          return (
            <button
              key={link.path}
              type="button"
              onClick={() => navigate(link.path)}
              className={`mobile-nav-link ${
                isActive ? 'mobile-nav-link-active' : ''
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{link.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
