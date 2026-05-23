import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import useAuthStore from '@/lib/stores/authStore'
import type { UserRole } from '@/lib/types'
import AppLayout from '@/components/layout/AppLayout'

// Auth
import LoginPage from '@/components/auth/LoginPage'
import ForgotPasswordPage from '@/components/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/components/auth/ResetPasswordPage'

// Alcalde screens
import AlcaldeDashboard from '@/components/alcalde/AlcaldeDashboard'
import AsuntosPendientes from '@/components/alcalde/AsuntosPendientes'
import GestionUsuarios from '@/components/alcalde/GestionUsuarios'

// Secretaria screens
import SecretariaDashboard from '@/components/secretaria/SecretariaDashboard'
import SeguimientoSolicitudes from '@/components/secretaria/SeguimientoSolicitudes'
import SubirDocumento from '@/components/secretaria/SubirDocumento'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

interface ProtectedLayoutRouteProps extends ProtectedRouteProps {
  title: string
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'alcalde') {
      return <Navigate to="/alcalde" replace />
    }

    return <Navigate to="/secretaria" replace />
  }

  return <>{children}</>
}

function ProtectedLayoutRoute({
  children,
  allowedRoles,
  title,
}: ProtectedLayoutRouteProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout title={title}>{children}</AppLayout>
    </ProtectedRoute>
  )
}

function AuthRedirect() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    if (user.role === 'alcalde') {
      return <Navigate to="/alcalde" replace />
    }

    return <Navigate to="/secretaria" replace />
  }

  return <LoginPage />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route
            path="/alcalde"
            element={
              <ProtectedLayoutRoute allowedRoles={['alcalde']} title="Dashboard">
                <AlcaldeDashboard />
              </ProtectedLayoutRoute>
            }
          />
          <Route
            path="/alcalde/pendientes"
            element={
              <ProtectedLayoutRoute allowedRoles={['alcalde']} title="Asuntos Pendientes">
                <AsuntosPendientes />
              </ProtectedLayoutRoute>
            }
          />
          <Route
            path="/alcalde/usuarios"
            element={
              <ProtectedLayoutRoute
                allowedRoles={['alcalde', 'administrador']}
                title="Gestion de Usuarios"
              >
                <GestionUsuarios />
              </ProtectedLayoutRoute>
            }
          />

          <Route
            path="/secretaria"
            element={
              <ProtectedLayoutRoute
                allowedRoles={['secretaria', 'administrador']}
                title="Dashboard"
              >
                <SecretariaDashboard />
              </ProtectedLayoutRoute>
            }
          />
          <Route
            path="/secretaria/seguimiento"
            element={
              <ProtectedLayoutRoute
                allowedRoles={['secretaria', 'administrador']}
                title="Seguimiento de Solicitudes"
              >
                <SeguimientoSolicitudes />
              </ProtectedLayoutRoute>
            }
          />
          <Route
            path="/secretaria/subir"
            element={
              <ProtectedLayoutRoute
                allowedRoles={['secretaria', 'administrador']}
                title="Subir Documento"
              >
                <SubirDocumento />
              </ProtectedLayoutRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
