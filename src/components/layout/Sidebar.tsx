import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '@/lib/stores/authStore'
import '../../styles/globals.css'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

type Role =
  | 'alcalde'
  | 'secretaria'

type NavItem = {
  label: string
  href: string
  roles: Role[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    roles: ['alcalde', 'secretaria'],
  },
  {
    label: 'Asuntos Pendientes',
    href: '/asuntos',
    roles: ['alcalde'],
  },
  {
    label: 'Usuarios',
    href: '/usuarios',
    roles: ['alcalde'],
  },
  {
    label: 'Subir Documento',
    href: '/subir-documento',
    roles: ['secretaria'],
  },
  {
    label: 'Seguimiento',
    href: '/seguimiento',
    roles: ['secretaria'],
  },
]

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate()

  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore(
    (state) => state.logout
  )

  const role = user?.role as Role | undefined

  const items = role
    ? navItems.filter((item) =>
        item.roles.includes(role)
      )
    : []

  return (
    <aside
      className="sidebar-panel"
      aria-label="Sidebar"
    >
      <div className="flex items-center gap-3 px-1 pb-4">
        <div
          className="flex h-10.5 w-10.5 items-center justify-center rounded-xl bg-white/15 font-black"
          aria-hidden
        >
          <img
              src="/logo-alcaldia.jpg"
              alt="Logo Alcaldía"
              className="h-15 w-auto object-contain"
            />
        </div>

        <div>
          <div className="text-sm font-black">
            Alcaldía de Santiago
          </div>

          <div className="text-xs opacity-90">
            Sistema
          </div>
        </div>
      </div>

      <div className="sidebar-user-card">
        <div
          className="user-avatar"
          aria-hidden
        >
          {user?.name?.charAt(0) ?? 'U'}
        </div>

        <div className="text-sm font-extrabold">
          {user?.name ?? 'Invitado'}
        </div>

        <div className="text-xs capitalize opacity-90">
          {role ?? '—'}
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => {
              if (isOpen) onClose()
            }}
            className={({ isActive }) =>
              `
                sidebar-link
                ${
                  isActive
                    ? 'sidebar-link-hover'
                    : ''
                }
              hover:bg-yellow-500/50 transition-transform hover:scale-105`
            }
          >
            {item.label}
          </NavLink>
        ))}

        {items.length === 0 && (
          <div className="p-2 text-sm opacity-90">
            Sin accesos para este rol.
          </div>
        )}
      </nav>

      <div className="pt-4">
        <button
          type="button"
          onClick={() => {
            logout()
            onClose()
            navigate('/login')
          }}
          className="sidebar-link w-full bg-white/10 hover:bg-red-500/50 transition-transform hover:scale-105"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}