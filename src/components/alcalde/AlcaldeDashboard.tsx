import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  ArrowRight,
  CheckCircle,
  Clock,
  CornerDownLeft,
  Crown,
  FileText,
  TrendingUp,
  Building2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import EstadoBadge from '@/components/shared/EstadoBadge'
import FechaLimiteBadge from '@/components/shared/FechaLimiteBadge'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { SolicitudEstado } from '@/lib/types'

const ESTADOS_DEPARTAMENTO_PENDIENTES: SolicitudEstado[] = [
  'assigned_to_department',
  'in_review',
  'returned_to_department',
]

interface StatCard {
  title: string
  value: number
  icon: LucideIcon
  color: string
  bgColor: string
}

export default function AlcaldeDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const solicitudes = useSolicitudesStore(state => state.solicitudes)
  const getStats = useSolicitudesStore(state => state.getStats)
  const departamentos = useDepartamentosStore(state => state.departamentos)

  const globalStats = useMemo(() => {
    return getStats()
  }, [getStats, solicitudes])

  const notasUrgentes = useMemo(() => {
    return solicitudes
      .filter(solicitud => solicitud.estado === 'awaiting_mayor_signature')
      .sort(
        (a, b) =>
          new Date(a.fechaLimite).getTime() -
          new Date(b.fechaLimite).getTime(),
      )
      .slice(0, 5)
  }, [solicitudes])

  const departamentoStats = useMemo(() => {
    return departamentos
      .map(departamento => {
        const depSolicitudes = solicitudes.filter(
          solicitud => solicitud.departamentoId === departamento.id,
        )

        const pendientes = depSolicitudes.filter(solicitud =>
          ESTADOS_DEPARTAMENTO_PENDIENTES.includes(solicitud.estado),
        ).length

        return {
          ...departamento,
          total: depSolicitudes.length,
          pendientes,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [departamentos, solicitudes])

  const conteoEstados = useMemo(() => {
    return {
      pendientesFirma: solicitudes.filter(
        solicitud => solicitud.estado === 'awaiting_mayor_signature',
      ).length,
      firmadas: solicitudes.filter(solicitud => solicitud.estado === 'signed').length,
      devueltas: solicitudes.filter(
        solicitud => solicitud.estado === 'returned_to_department',
      ).length,
      cerradas: solicitudes.filter(solicitud => solicitud.estado === 'closed').length,
    }
  }, [solicitudes])

  const statCards: StatCard[] = [
    {
      title: 'Total Notas',
      value: globalStats.total,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pendientes de Firma',
      value: conteoEstados.pendientesFirma,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Firmadas',
      value: conteoEstados.firmadas,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Devueltas',
      value: conteoEstados.devueltas,
      icon: CornerDownLeft,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Cerradas',
      value: conteoEstados.cerradas,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ]

  return (
    <AppLayout title="Dashboard">
      <div className="flex w-full max-w-7xl flex-col gap-6 p-4 mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Crown className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h1 className="font-serif text-2xl font-bold text-primary">
                Panel del Alcalde
              </h1>
              <p className="text-muted-foreground">
                Bienvenido/a, {user?.nombre}. Vista general del sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/alcalde/notas')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver todas las notas
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map(stat => {
            const Icon = stat.icon

            return (
              <div
                key={stat.title}
                className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Building2 className="h-5 w-5 text-primary" />
                Notas por Departamento
              </h2>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {departamentoStats.slice(0, 5).map(departamento => (
                  <div
                    key={departamento.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {departamento.nombre}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {departamento.pendientes} pendientes
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {departamento.total}
                      </p>
                      <p className="text-xs text-muted-foreground">notas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                Distribución por Estado
              </h2>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap items-center justify-center gap-6 py-4">
                {[
                  {
                    label: 'Pendientes',
                    value: globalStats.pendientes,
                    color: 'bg-yellow-500',
                  },
                  {
                    label: 'En Revisión',
                    value: globalStats.enRevision,
                    color: 'bg-blue-500',
                  },
                  {
                    label: 'Aprobadas',
                    value: globalStats.aprobadas,
                    color: 'bg-green-500',
                  },
                  {
                    label: 'Declinadas',
                    value: globalStats.declinadas,
                    color: 'bg-red-500',
                  },
                  {
                    label: 'Finalizadas',
                    value: globalStats.finalizadas,
                    color: 'bg-gray-500',
                  },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white ${item.color}`}
                    >
                      {item.value}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border p-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Clock className="h-5 w-5 text-yellow-500" />
              Notas Próximas a Vencer
            </h2>

            <button
              type="button"
              onClick={() => navigate('/alcalde/notas')}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {notasUrgentes.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No hay notas pendientes.
              </p>
            ) : (
              <div className="space-y-3">
                {notasUrgentes.map(nota => (
                  <div
                    key={nota.id}
                    className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-muted-foreground">
                          {nota.radicado}
                        </span>
                        <EstadoBadge estado={nota.estado} />
                      </div>

                      <p className="truncate font-medium text-foreground">
                        {nota.titulo}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {nota.departamento?.nombre ?? 'Sin asignar'}
                      </p>
                    </div>

                    <FechaLimiteBadge fechaLimite={nota.fechaLimite} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}