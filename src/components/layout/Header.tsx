import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import useAuthStore from '@/lib/stores/authStore'
import '../../styles/globals.css'

type HeaderProps = {
  title: string
  onMenuClick: () => void
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [isUserMenuOpen, setIsUserMenuOpen] =
    useState(false)

  const unreadCount = 3

  const notificationIcon = useMemo(() => {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M13.73 21a2 2 0 01-3.46 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }, [])

  return (
    <header
      className="header-base"
      onMouseLeave={() =>
        setIsUserMenuOpen(false)
      }
    >
      <div className="header-inner">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="icon-button icon-button-soft lg:hidden"
            aria-label="Abrir menú"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div>
            <h1 className="m-0 text-lg font-black">
              {"Bienvenido(a), " + (user?.role ?? 'Usuario') + " " + (user?.name ?? '')}
            </h1>
            <small>
              {new Date().toDateString()}
            </small>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              className="icon-button"
              aria-label="Notificaciones"
            >
              {notificationIcon}
            </button>

            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[11px] font-black text-white cursor-pointer">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setIsUserMenuOpen((prev) => !prev)
              }
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 cursor-pointer"
              aria-label="Menú de usuario"
            >
              <div
                className="user-avatar"
                aria-hidden
              >
                {user?.name?.charAt(0) ?? 'U'}
              </div>

              <span className="text-sm font-black text-slate-900">
                {<span>&#9662;</span>}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="dropdown-menu">
                <button
                  type="button"
                  className="dropdown-item hover:bg-gray-400/20"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    navigate('/perfil')
                  }}
                >
                  Ver perfil
                </button>

                <button
                  type="button"
                  className="dropdown-item text-red-500 hover:bg-red-600/20 transition-transform"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    navigate('/login')
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}