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

import AppLayout from '@/components/layout/AppLayout'
import FechaLimiteBadge from '@/components/shared/FechaLimiteBadge'
import EstadoBadge from '@/components/shared/EstadoBadge'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { SolicitudEstado } from '@/lib/types'

const ESTADOS_TERMINALES: SolicitudEstado[] = [
  'signed',
  'closed',
  'rejected_by_department',
  'rejected_by_mayor_office',
]

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

  const misSolicitudes = useMemo(
    () => solicitudes.filter((s) => s.subidoPorId === user?.id),
    [solicitudes, user?.id],
  )

  const stats = useMemo(() => {
    const contar = (...estados: SolicitudEstado[]) =>
      misSolicitudes.filter((s) => estados.includes(s.estado)).length
    return {
      total: misSolicitudes.length,
      sinRespuesta: contar('received', 'assigned_to_department', 'in_review'),
      aprobadas: contar('signed', 'closed'),
      declinadas: contar('rejected_by_department', 'rejected_by_mayor_office'),
    }
  }, [misSolicitudes])

  const activas = useMemo(
    () => misSolicitudes.filter((s) => !ESTADOS_TERMINALES.includes(s.estado)).length,
    [misSolicitudes],
  )

  const proximasAVencer = useMemo(
    () =>
      [...misSolicitudes]
        .sort(
          (a, b) =>
            new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime(),
        )
        .slice(0, 5),
    [misSolicitudes],
  )

  return (
    <AppLayout title="Dashboard">
      <div className="dashboard-section">
        <h1 className="dashboard-title">Hola, {user?.nombre ?? 'Secretaria'}</h1>
        <p className="dashboard-subtitle capitalize">{fechaHoy}</p>
      </div>

      {/* Tarjetas con iconos forzados a la derecha */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-label">Total</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-icon ml-5">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-label">Sin respuesta</p>
              <p className="stat-value">{stats.sinRespuesta}</p>
            </div>
            <div className="stat-icon stat-icon-amber ml-5">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-label">Aprobadas</p>
              <p className="stat-value">{stats.aprobadas}</p>
            </div>
            <div className="stat-icon stat-icon-green ml-5">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-label">Declinadas</p>
              <p className="stat-value">{stats.declinadas}</p>
            </div>
            <div className="stat-icon stat-icon-red ml-5">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Botones de navegación (sin cambios) */}
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

      {/* Notas próximas a vencer (sin cambios) */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="text-lg font-semibold text-foreground">Notas próximas a vencer</h2>
          <button
            type="button"
            onClick={() => navigate('/secretaria/notas')}
            className="dashboard-link-btn"
          >
            Ver todas
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {proximasAVencer.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes notas registradas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {proximasAVencer.map((solicitud) => (
              <li key={solicitud.id} className="nota-urgente-row">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium text-foreground">
                    {solicitud.titulo}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono">{solicitud.radicado}</span>
                    <span>·</span>
                    <span>{solicitud.departamento?.nombre ?? 'Sin asignar'}</span>
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
                  <EstadoBadge estado={solicitud.estado} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  )
}