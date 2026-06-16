import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronDown,
  Info,
  LogOut,
  Menu,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/lib/stores/authStore'
import useNotificationStore from '@/lib/stores/notificationStore'
import { ROLE_LABELS } from '@/lib/types'

interface HeaderProps {
  title?: string
  onMenuClick: () => void
  showMenuButton?: boolean
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Hace un momento'
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`

  return `Hace ${Math.floor(diffInSeconds / 86400)} días`
}

const notificationTypeConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
  },
  info: {
    icon: Info,
    className: 'bg-blue-100 text-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-100 text-amber-700',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-100 text-red-700',
  },
}

export default function Header({
  title,
  onMenuClick,
  showMenuButton = true,
}: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { notificaciones, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const unreadNotifications = unreadCount()
  const fullName = user ? `${user.nombre} ${user.apellido}` : ''
  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase()
  const roleLabel = user ? ROLE_LABELS[user.role] : ''

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProfileClick = () => {
    setShowUserMenu(false)
    navigate('/perfil')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="layout-header">
      <div className="layout-header-inner lg:px-6">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuClick}
              className="icon-button hover:bg-secondary lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <h1 className="font-serif text-lg font-semibold text-foreground">
            {title || 'Sistema de Ayuda Social'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className="icon-button relative hover:bg-secondary"
              aria-label="Notificaciones"
              aria-expanded={showNotifications}
            >
              <Bell className="h-5 w-5" />

              {unreadNotifications > 0 && (
                <span className="notification-badge">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="dropdown-panel w-80">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h2 className="font-medium">Notificaciones</h2>

                  {unreadNotifications > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      No hay notificaciones
                    </p>
                  ) : (
                    notificaciones.slice(0, 5).map((notification) => {
                      const config = notificationTypeConfig[notification.type]
                      const Icon = config.icon

                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className={`w-full border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary/50 ${
                            !notification.read ? 'bg-secondary/30' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.className}`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground">
                                {notification.message}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((current) => !current)}
              className="icon-button flex items-center gap-2 hover:bg-secondary"
              aria-label="Menú de usuario"
              aria-expanded={showUserMenu}
            >
              <div className="header-avatar">
                <span className="text-sm font-medium">{initials}</span>
              </div>

              <ChevronDown className="hidden h-4 w-4 sm:block" />
            </button>

            {showUserMenu && (
              <div className="dropdown-panel w-56">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate font-medium">{fullName}</p>
                  <span className="mt-2 inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {roleLabel}
                  </span>
                </div>

                <div className="border-b border-border py-1">
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="dropdown-item hover:bg-secondary"
                  >
                    <User className="h-4 w-4" />
                    <span>Mi perfil</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="dropdown-item text-destructive hover:bg-secondary"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}