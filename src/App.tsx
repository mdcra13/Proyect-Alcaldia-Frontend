import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '@/components/auth/LoginPage'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'

function DashboardPage() {
  return <div>Dashboard</div>
}

function AsuntosPage() {
  return <div>Asuntos pendientes</div>
}

function UsuariosPage() {
  return <div>Gestión de usuarios</div>
}

function SeguimientoPage() {
  return <div>Seguimiento</div>
}

function SubirDocumentoPage() {
  return <div>Subir documento</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout title="Dashboard">
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/asuntos"
          element={
            <ProtectedRoute>
              <AppLayout title="Asuntos Pendientes">
                <AsuntosPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <AppLayout title="Usuarios">
                <UsuariosPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/seguimiento"
          element={
            <ProtectedRoute>
              <AppLayout title="Seguimiento">
                <SeguimientoPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/subir-documento"
          element={
            <ProtectedRoute>
              <AppLayout title="Subir Documento">
                <SubirDocumentoPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}