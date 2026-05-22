import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from '@/components/auth/LoginPage'
import ProtectedRoute, { AuthRedirect } from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import ForgotPasswordPage from '@/components/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/components/auth/ResetPasswordPage'
import AlcaldeDashboard from '@/components/alcalde/AlcaldeDashboard'
import SecretariaDashboard from '@/components/secretaria/SecretariaDashboard'
import AsuntosPendientes from './components/alcalde/AsuntosPendientes';
import GestionUsuarios from './components/alcalde/GestionUsuarios';
import SeguimientoSolicitudes from './components/secretaria/SeguimientoSolicitudes';
import SubirDocumento from './components/secretaria/SubirDocumento';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Protected App */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout title="Sistema" />
            </ProtectedRoute>
          }
        >
          <Route path="asuntos" element={<AsuntosPendientes />} />
          <Route path="usuarios" element={<GestionUsuarios />} />
          <Route path="seguimiento" element={<SeguimientoSolicitudes />} />
          <Route path="subir-documento" element={<SubirDocumento />} />
        </Route>

        {/* Role-specific dashboards */}
        <Route
          path="alcalde"
          element={
            <ProtectedRoute allowedRoles={['alcalde']}>
              <AppLayout title="Alcalde" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AlcaldeDashboard />} />
        </Route>

        <Route
          path="secretaria"
          element={
            <ProtectedRoute allowedRoles={['secretaria']}>
              <AppLayout title="Secretaría" />
            </ProtectedRoute>
          }
        >
          <Route index element={<SecretariaDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
  )
}