import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { UserRole } from '@/lib/types'

const LoginPage = lazy(() => import('@/components/auth/LoginPage'))
const AlcaldeDashboard = lazy(() => import('@/components/alcalde/AlcaldeDashboard'))
const SecretariaDashboard = lazy(() =>
  import('@/components/secretaria/SecretariaDashboard').then(module => ({
    default: module.SecretariaDashboard,
  }))
)
const SeguimientoSolicitudes = lazy(() =>
  import('@/components/secretaria/SeguimientoSolicitudes')
)
const SubirDocumento = lazy(() => import('@/components/secretaria/SubirDocumento'))

const AlcaldeNotas = lazy(() => import('@/components/alcalde/AlcaldeNotas'))
const SecretariaNotas = lazy(() => import('@/components/secretaria/SecretariaNotas'))
const DepartamentoDashboard = lazy(() => import('@/components/departamento/DepartamentoDashboard'))
const NotasPendientes = lazy(() => import('@/components/departamento/NotasPendientes'))
const SeguimientoNotas = lazy(() => import('@/components/departamento/SeguimientoNotas'))
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

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">
          Cargando Sistema de Ayuda Social...
        </p>
      </div>
    </div>
  )
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
      case 'funcionario':
        return <Navigate to="/departamento" replace />
      case 'it':
        return <Navigate to="/it" replace />
      default:
        return <Navigate to="/" replace />
    }
  }

  return <LoginPage />
}

function BackendBootstrap() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const role = useAuthStore(state => state.user?.role)
  const fetchUsers = useAuthStore(state => state.fetchUsers)
  const fetchDepartamentos = useDepartamentosStore(state => state.fetchDepartamentos)
  const fetchSolicitudes = useSolicitudesStore(state => state.fetchSolicitudes)

  useEffect(() => {
    if (!isAuthenticated) return

    void fetchDepartamentos().catch(() => undefined)
    void fetchSolicitudes()
    if (role === 'it') void fetchUsers().catch(() => undefined)
  }, [fetchDepartamentos, fetchSolicitudes, fetchUsers, isAuthenticated, role])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <BackendBootstrap />
        <Suspense fallback={<PageLoader />}>
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
              path="/alcalde/notas"
              element={
                <ProtectedRoute allowedRoles={['alcalde']}>
                  <AlcaldeNotas />
                </ProtectedRoute>
              }
            />

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

            <Route
              path="/departamento"
              element={
                <ProtectedRoute allowedRoles={['departamento', 'funcionario']}>
                  <DepartamentoDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departamento/dashboard"
              element={
                <ProtectedRoute allowedRoles={['departamento', 'funcionario']}>
                  <DepartamentoDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departamento/pendientes"
              element={
                <ProtectedRoute allowedRoles={['departamento', 'funcionario']}>
                  <NotasPendientes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departamento/seguimiento"
              element={
                <ProtectedRoute allowedRoles={['departamento', 'funcionario']}>
                  <SeguimientoNotas />
                </ProtectedRoute>
              }
            />

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
