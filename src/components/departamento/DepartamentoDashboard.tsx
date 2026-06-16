import { useMemo } from 'react'
import { Building2, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { SolicitudEstado } from '@/lib/types'

const ESTADOS_PENDIENTES_DEPTO: SolicitudEstado[] = [
  'assigned_to_department',
  'in_review',
  'returned_to_department',
]

const ESTADOS_APROBADAS_DEPTO: SolicitudEstado[] = [
  'approved_by_department',
  'awaiting_mayor_signature',
  'signed',
  'closed',
]

const ESTADOS_RECHAZADAS_DEPTO: SolicitudEstado[] = [
  'rejected_by_department',
  'rejected_by_mayor_office',
]

export default function DepartamentoDashboard() {
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
    () => solicitudes.filter(s => s.departamentoId === user?.departamentoId),
    [solicitudes, user?.departamentoId],
  )

  const stats = useMemo(
    () => ({
      pendientes: misSolicitudes.filter(s => ESTADOS_PENDIENTES_DEPTO.includes(s.estado)).length,
      total: misSolicitudes.length,
      aprobadas: misSolicitudes.filter(s => ESTADOS_APROBADAS_DEPTO.includes(s.estado)).length,
      rechazadas: misSolicitudes.filter(s => ESTADOS_RECHAZADAS_DEPTO.includes(s.estado)).length,
    }),
    [misSolicitudes],
  )

  const departamentoNombre = user?.departamento?.nombre ?? 'Mi Departamento'

  return (
    <AppLayout title="Dashboard">
      <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="dashboard-title">
            Bienvenido, Departamento {user?.nombre ?? ''}
          </h1>
          <p className="dashboard-subtitle capitalize">{fechaHoy}</p>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-center rounded-xl bg-muted p-3">
            <Building2 className="h-8 w-8 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{departamentoNombre}</h2>
            <p className="text-sm text-muted-foreground">
              Revisa y aprueba las solicitudes asignadas. Las aprobadas pasan al Alcalde.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="stat-card stat-card-amber transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between w-full h-full">
              <div className="flex-1">
                <p className="stat-label uppercase">Notas Pendientes</p>
                <p className="stat-value">{stats.pendientes}</p>
              </div>
              <div className="stat-icon stat-icon-amber ml-auto">
                <Clock className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="stat-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between w-full h-full">
              <div className="flex-1">
                <p className="stat-label uppercase">Total Recibidas</p>
                <p className="stat-value">{stats.total}</p>
              </div>
              <div className="stat-icon ml-auto">
                <FileText className="h-7 w-7" />
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
                <p className="stat-label uppercase">Rechazadas</p>
                <p className="stat-value">{stats.rechazadas}</p>
              </div>
              <div className="stat-icon stat-icon-red ml-auto">
                <XCircle className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
