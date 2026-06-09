import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import useAuthStore from '@/lib/stores/authStore'
import type { UserRole } from '@/lib/types'
import LoginPage from '@/components/auth/LoginPage'
import AlcaldeDashboard from '@/components/alcalde/AlcaldeDashboard'
import AsuntosPendientes from '@/components/alcalde/AsuntosPendientes'
import { SecretariaDashboard } from '@/components/secretaria/SecretariaDashboard'
import SeguimientoSolicitudes from '@/components/secretaria/SeguimientoSolicitudes'
import SubirDocumento from '@/components/secretaria/SubirDocumento'

const AlcaldeNotas = lazy(() => import('@/components/alcalde/AlcaldeNotas'))
const SecretariaNotas = lazy(() => import('@/components/secretaria/SecretariaNotas'))
const DepartamentoDashboard = lazy(() => import('@/components/departamento/DepartamentoDashboard'))
const ITDashboard = lazy(() => import('@/components/it/ITDashboard'))
const ITGestionUsuarios = lazy(() => import('@/components/it/ITGestionUsuarios'))
const ITGestionDepartamentos = lazy(() => import('@/components/it/ITGestionDepartamentos'))
const PerfilUsuario = lazy(() => import('@/components/shared/PerfilUsuario'))

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

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AuthRedirect() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'alcalde':
        return <Navigate to="/alcalde" replace />
      case 'secretaria':
        return <Navigate to="/secretaria" replace />
      case 'departamento':
        return <Navigate to="/departamento" replace />
      case 'it':
        return <Navigate to="/it" replace />
      default:
        return <Navigate to="/" replace />
    }
  }

  return <LoginPage />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<AuthRedirect />} />

            {/* Alcalde */}
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
              path="/alcalde/notas"
              element={
                <ProtectedRoute allowedRoles={['alcalde']}>
                  <AlcaldeNotas />
                </ProtectedRoute>
              }
            />

            {/* Secretaria */}
            <Route
              path="/secretaria"
              element={
                <ProtectedRoute allowedRoles={['secretaria']}>
                  <SecretariaDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretaria/notas"
              element={
                <ProtectedRoute allowedRoles={['secretaria']}>
                  <SecretariaNotas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretaria/subir"
              element={
                <ProtectedRoute allowedRoles={['secretaria']}>
                  <SubirDocumento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretaria/seguimiento"
              element={
                <ProtectedRoute allowedRoles={['secretaria']}>
                  <SeguimientoSolicitudes />
                </ProtectedRoute>
              }
            />

            {/* Departamento */}
            <Route
              path="/departamento"
              element={
                <ProtectedRoute allowedRoles={['departamento']}>
                  <DepartamentoDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departamento/solicitudes"
              element={
                <ProtectedRoute allowedRoles={['departamento']}>
                  <DepartamentoDashboard />
                </ProtectedRoute>
              }
            />

            {/* IT */}
            <Route
              path="/it"
              element={
                <ProtectedRoute allowedRoles={['it']}>
                  <ITDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/it/usuarios"
              element={
                <ProtectedRoute allowedRoles={['it']}>
                  <ITGestionUsuarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/it/departamentos"
              element={
                <ProtectedRoute allowedRoles={['it']}>
                  <ITGestionDepartamentos />
                </ProtectedRoute>
              }
            />

            {/* Perfil — accesible para todos los roles */}
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <PerfilUsuario />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
