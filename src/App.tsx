import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import useAuthStore from '@/lib/stores/authStore'
import type { UserRole } from '@/lib/types'

// Auth
import LoginPage from '@/components/auth/LoginPage'

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
          <Route
            path="/alcalde"
            element={
              <ProtectedRoute allowedRoles={['alcalde']}>
                <AlcaldeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alcalde/pendientes"
            element={
              <ProtectedRoute allowedRoles={['alcalde']}>
                <AsuntosPendientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alcalde/usuarios"
            element={
              <ProtectedRoute allowedRoles={['alcalde', 'administrador']}>
                <GestionUsuarios />
              </ProtectedRoute>
            }
          />

          <Route
            path="/secretaria"
            element={
              <ProtectedRoute allowedRoles={['secretaria', 'administrador']}>
                <SecretariaDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretaria/seguimiento"
            element={
              <ProtectedRoute allowedRoles={['secretaria', 'administrador']}>
                <SeguimientoSolicitudes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretaria/subir"
            element={
              <ProtectedRoute allowedRoles={['secretaria', 'administrador']}>
                <SubirDocumento />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}