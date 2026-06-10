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

const linksByRole: Record<UserRole, NavLink[]> = {
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
    { path: '/it/usuarios', label: 'Gestión de Usuarios', icon: Users },
    { path: '/it/departamentos', label: 'Departamentos', icon: Building2 },
  ],
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  if (!user) return null

  const links = linksByRole[user.role]
  const roleLabel = ROLE_LABELS[user.role]
  const fullName = `${user.nombre} ${user.apellido}`
  const initials = `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase()
  const roleDetail =
    user.role === 'departamento' && user.departamento
      ? user.departamento.nombre
      : roleLabel

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
          <div className="flex items-start justify-between">
            <div>
              <div className="layout-sidebar-logo">
                <span className="text-xs text-white/70">Logo Alcaldía</span>
              </div>
              <p className="text-sm font-semibold leading-tight">
                Sistema de Ayuda Social
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="icon-button hover:bg-white/10 lg:hidden"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="layout-sidebar-section">
          <div className="flex items-center gap-3">
            <div className="layout-sidebar-avatar">
              <span className="text-sm font-medium">{initials}</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{fullName}</p>
              <p className="text-sm text-white/70">{roleDetail}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {links.map(link => {
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