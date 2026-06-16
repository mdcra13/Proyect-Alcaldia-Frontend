import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileUp,
  ListChecks,
  XCircle,
} from 'lucide-react'

import AppLayout from '@/components/layout/AppLayout'
import EstadoBadge from '@/components/shared/EstadoBadge'
import FechaLimiteBadge from '@/components/shared/FechaLimiteBadge'
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
  const user = useAuthStore(state => state.user)
  const solicitudes = useSolicitudesStore(state => state.solicitudes)

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
    () => solicitudes.filter(solicitud => solicitud.subidoPorId === user?.id),
    [solicitudes, user?.id],
  )

  const stats = useMemo(() => {
    const contar = (...estados: SolicitudEstado[]) =>
      misSolicitudes.filter(solicitud => estados.includes(solicitud.estado)).length

    return {
      total: misSolicitudes.length,
      sinRespuesta: contar(
      'received',
      'assigned_to_department',
      'in_review',
      'returned_to_department'
      ),
      aprobadas: contar('signed', 'closed', 'approved_by_department', 'awaiting_mayor_signature'),
      declinadas: contar('rejected_by_department', 'rejected_by_mayor_office'),
    }
  }, [misSolicitudes])

  const activas = useMemo(
    () =>
      misSolicitudes.filter(
        solicitud => !ESTADOS_TERMINALES.includes(solicitud.estado),
      ).length,
    [misSolicitudes],
  )

  const proximasAVencer = useMemo(
  () =>
    [...misSolicitudes]
      .filter(solicitud => !ESTADOS_TERMINALES.includes(solicitud.estado))
      .sort(
        (a, b) =>
          new Date(a.fechaLimite).getTime() -
          new Date(b.fechaLimite).getTime(),
      )
      .slice(0, 5),
  [misSolicitudes],
)

  return (
    <AppLayout title="Dashboard">
      <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="dashboard-title">
            Hola, {user?.nombre ?? 'Secretaria'}
          </h1>
          <p className="dashboard-subtitle capitalize">{fechaHoy}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="stat-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex-1">
              <p className="stat-label uppercase">Total Solicitudes</p>
              <p className="stat-value">{stats.total}</p>
            </div>

            <div className="stat-icon ml-auto">
              <FileText className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-amber transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex-1">
              <p className="stat-label uppercase">Pendientes</p>
              <p className="stat-value">{stats.sinRespuesta}</p>
            </div>

            <div className="stat-icon stat-icon-amber ml-auto">
              <AlertTriangle className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex-1">
              <p className="stat-label uppercase">Aprobadas</p>
              <p className="stat-value">{stats.aprobadas}</p>
            </div>

            <div className="stat-icon stat-icon-green ml-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-red transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex-1">
              <p className="stat-label uppercase">Declinadas</p>
              <p className="stat-value">{stats.declinadas}</p>
            </div>

            <div className="stat-icon stat-icon-red ml-auto">
              <XCircle className="h-7 w-7" />
            </div>
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <button
            type="button"
            onClick={() => navigate('/secretaria/subir')}
              className="dashboard-nav-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="dashboard-nav-card-content">
              <div className="dashboard-nav-icon dashboard-nav-icon-amber">
                <FileUp className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Subir Documento
                </h2>
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
            className="dashboard-nav-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
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

        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">
              Notas próximas a vencer
            </h2>

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
            <p className="text-sm text-muted-foreground">
              No tienes notas registradas.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {proximasAVencer.map(solicitud => (
                <li
                  key={solicitud.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-secondary/30 hover:shadow-md"
                >
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

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
                    <EstadoBadge estado={solicitud.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  )
}