import { useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Upload,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import useAuthStore from '@/lib/stores/authStore'
import type { UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

interface NavLink {
  path: string
  label: string
  icon: LucideIcon
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navLinksByRole: Record<UserRole, NavLink[]> = {
  alcalde: [
    { path: '/alcalde', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/alcalde/notas', label: 'Listado de Notas', icon: ClipboardList },
  ],
  secretaria: [
    { path: '/secretaria', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/secretaria/notas', label: 'Mis Notas', icon: ClipboardList },
    { path: '/secretaria/subir', label: 'Subir Nota', icon: Upload },
    { path: '/secretaria/seguimiento', label: 'Seguimiento', icon: FileSearch },
  ],
  departamento: [
    { path: '/departamento', label: 'Dashboard', icon: LayoutDashboard },
  ],
  it: [
    { path: '/it', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/it/usuarios', label: 'Usuarios', icon: Users },
    { path: '/it/departamentos', label: 'Departamentos', icon: Building2 },
  ],
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (!user) return null

  const links = navLinksByRole[user.role] ?? []
  const roleLabel = ROLE_LABELS[user.role] ?? user.role
  const firstName = user.nombre ?? ''
  const lastName = user.apellido ?? ''
  const fullName = `${firstName} ${lastName}`.trim()
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="layout-sidebar-overlay lg:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`layout-sidebar lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="layout-sidebar-section">
          <div className="flex flex-col items-center relative">
            {/* Logo centrado sin bordes */}
            <div className="border-none shadow-none bg-transparent">
              <img
                src="/img-001.jpg"
                alt="Logo Alcaldía"
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-sm font-semibold leading-tight text-center mt-1">
              Sistema de Ayuda Social
            </p>
            <button
              type="button"
              onClick={onClose}
              className="icon-button hover:bg-white/10 lg:hidden absolute right-0 top-0"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="layout-sidebar-section">
          <div className="flex items-center gap-3">
            <div className="layout-sidebar-avatar">
              <span className="text-sm font-medium">{initials || 'U'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{fullName || 'Usuario'}</p>
              <p className="text-sm text-white/70">
                {(user as any)?.departamento?.nombre ?? roleLabel}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = location.pathname === link.path
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => handleNavigation(link.path)}
                className={`layout-sidebar-link hover:bg-white/10 ${
                  isActive ? 'layout-sidebar-link-active' : ''
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{link.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="layout-sidebar-footer">
          <button
            type="button"
            onClick={handleLogout}
            className="layout-sidebar-link hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}