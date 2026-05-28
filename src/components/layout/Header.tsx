import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/lib/stores/authStore'
import useNotificationStore from '@/lib/stores/notificationStore'

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

export default function Header({
  title,
  onMenuClick,
  showMenuButton = true,
}: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const unreadNotifications = unreadCount()

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
              onClick={() => setShowNotifications(!showNotifications)}
              className="icon-button relative hover:bg-secondary"
              aria-label="Notificaciones"
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
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      No hay notificaciones
                    </p>
                  ) : (
                    notifications.slice(0, 5).map(notification => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className={`w-full border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary/50 ${
                          !notification.read ? 'bg-secondary/30' : ''
                        }`}
                      >
                        <p className="text-sm">{notification.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="icon-button flex items-center gap-2 hover:bg-secondary"
              aria-label="Menú de usuario"
            >
              <div className="header-avatar">
                <span className="text-sm font-medium">
                  {user?.name
                    ?.split(' ')
                    .map(name => name[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>

              <ChevronDown className="hidden h-4 w-4 sm:block" />
            </button>

            {showUserMenu && (
              <div className="dropdown-panel w-52">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate font-medium">{user?.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(false)}
                    className="dropdown-item hover:bg-secondary"
                  >
                    <User className="h-4 w-4" />
                    <span>Ver perfil</span>
                  </button>

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
