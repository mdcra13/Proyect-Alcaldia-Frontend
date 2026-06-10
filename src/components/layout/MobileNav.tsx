import { useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  Upload,
  User,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import useAuthStore from '@/lib/stores/authStore'
import type { UserRole } from '@/lib/types'

interface MobileNavLink {
  path: string
  label: string
  icon: LucideIcon
}

const navLinksByRole: Record<UserRole, MobileNavLink[]> = {
  alcalde: [
    { path: '/alcalde', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/alcalde/notas', label: 'Notas', icon: ClipboardList },
  ],
  secretaria: [
    { path: '/secretaria', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/secretaria/notas', label: 'Mis Notas', icon: ClipboardList },
    { path: '/secretaria/subir', label: 'Subir', icon: Upload },
    { path: '/secretaria/seguimiento', label: 'Seguimiento', icon: FileSearch },
  ],
  departamento: [
    { path: '/departamento', label: 'Dashboard', icon: LayoutDashboard },
  ],
  it: [
    { path: '/it', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/it/usuarios', label: 'Usuarios', icon: Users },
    { path: '/it/departamentos', label: 'Deptos.', icon: Building2 },
  ],
}

const profileLink: MobileNavLink = {
  path: '/perfil',
  label: 'Perfil',
  icon: User,
}

const exactActivePaths = new Set(['/alcalde', '/secretaria', '/it', '/perfil'])

function isActiveRoute(currentPath: string, linkPath: string) {
  if (exactActivePaths.has(linkPath)) return currentPath === linkPath

  return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`)
}

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)

  const links = user ? [...navLinksByRole[user.role], profileLink] : [profileLink]

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
