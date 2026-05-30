// src/components/secretaria/SecretariaDashboard.tsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileUp,
  ListChecks,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileText,
} from 'lucide-react'
import  AppLayout  from '@/components/layout/AppLayout'
import useAuthStore  from '@/lib/stores/authStore'
import  useSolicitudesStore  from '@/lib/stores/solicitudesStore'
import type { SolicitudEstado } from '@/lib/types'

export function SecretariaDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const solicitudes = useSolicitudesStore((s) => s.solicitudes)

  const fechaHoy = useMemo(
    () =>
      new Date().toLocaleDateString('es-PA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  )

  const stats = useMemo(() => {
    const count = (estado: SolicitudEstado) =>
      solicitudes.filter((s) => s.estado === estado).length
    return {
      total: solicitudes.length,
      pendientes: count('pendiente'),
      enRevision: count('en_revision'),
      aprobadas: count('aprobado'),
      declinadas: count('declinado'),
    }
  }, [solicitudes])

  const activas = stats.pendientes + stats.enRevision

  return (
    <AppLayout title="Dashboard">
      {/* Saludo personalizado */}
      <div className="dashboard-section">
        <h1 className="dashboard-title">Hola, {user?.name ?? 'Secretaria'}</h1>
        <p className="dashboard-subtitle capitalize">{fechaHoy}</p>
      </div>

      {/* Resumen rápido de estados */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-inner">
            <div>
              <p className="stat-label">Total</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-icon">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="stat-card-inner">
            <div>
              <p className="stat-label">Pendientes</p>
              <p className="stat-value">{stats.pendientes}</p>
            </div>
            <div className="stat-icon stat-icon-amber">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-card-inner">
            <div>
              <p className="stat-label">Aprobadas</p>
              <p className="stat-value">{stats.aprobadas}</p>
            </div>
            <div className="stat-icon stat-icon-green">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="stat-card-inner">
            <div>
              <p className="stat-label">Declinadas</p>
              <p className="stat-value">{stats.declinadas}</p>
            </div>
            <div className="stat-icon stat-icon-red">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de navegación grandes */}
      <div className="dashboard-nav-grid sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/secretaria/subir')}
          className="dashboard-nav-card"
        >
          <div className="dashboard-nav-card-content">
            <div className="dashboard-nav-icon dashboard-nav-icon-amber">
              <FileUp className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Subir Documento</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registrar nueva solicitud ciudadana
              </p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/secretaria/seguimiento')}
          className="dashboard-nav-card"
        >
          <div className="dashboard-nav-card-content">
            <div className="dashboard-nav-icon dashboard-nav-icon-green">
              <ListChecks className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                Seguimiento de Solicitudes
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Revisa el estado de tus solicitudes · {activas} activas
              </p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </button>
      </div>
    </AppLayout>
  )
}