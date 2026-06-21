import type { HistorialEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Flag,
  PenLine,
  Search,
  Send,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

interface HistorialTimelineProps {
  historial: HistorialEntry[]
  className?: string
}

const accionConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  received: {
    icon: FileText,
    color: 'text-blue-600 bg-blue-100',
    label: 'Recibida',
  },
  assigned_to_department: {
    icon: Building2,
    color: 'text-blue-600 bg-blue-100',
    label: 'Asignada a departamento',
  },
  in_review: {
    icon: Search,
    color: 'text-green-600 bg-green-100',
    label: 'En revisión',
  },
  approved_by_department: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
    label: 'Aprobada por departamento',
  },
  rejected_by_department: {
    icon: XCircle,
    color: 'text-red-600 bg-red-100',
    label: 'Rechazada por departamento',
  },
  awaiting_mayor_signature: {
    icon: Send,
    color: 'text-purple-600 bg-purple-100',
    label: 'Pendiente de firma',
  },
  returned_to_department: {
    icon: Undo2,
    color: 'text-amber-600 bg-amber-100',
    label: 'Devuelta a departamento',
  },
  rejected_by_mayor_office: {
    icon: XCircle,
    color: 'text-red-700 bg-red-100',
    label: 'Rechazada por Alcaldía',
  },
  signed: {
    icon: PenLine,
    color: 'text-green-800 bg-green-100',
    label: 'Firmada',
  },
  closed: {
    icon: Flag,
    color: 'text-gray-600 bg-gray-100',
    label: 'Cerrada',
  },

  recibido: {
    icon: FileText,
    color: 'text-blue-600 bg-blue-100',
    label: 'Recibida',
  },
  asignado_a_departamento: {
    icon: Building2,
    color: 'text-blue-600 bg-blue-100',
    label: 'Asignada a departamento',
  },
  aprobado_por_departamento: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
    label: 'Aprobada por departamento',
  },
  rechazado_por_departamento: {
    icon: XCircle,
    color: 'text-red-600 bg-red-100',
    label: 'Rechazada por departamento',
  },
  rechazado_por_mayor_office: {
    icon: XCircle,
    color: 'text-red-700 bg-red-100',
    label: 'Rechazada por Alcaldía',
  },
  selected_by_mayor_office: {
    icon: XCircle,
    color: 'text-red-700 bg-red-100',
    label: 'Rechazada por Alcaldía',
  },
  firmado: {
    icon: PenLine,
    color: 'text-green-800 bg-green-100',
    label: 'Firmada',
  },
  cerrado: {
    icon: Flag,
    color: 'text-gray-600 bg-gray-100',
    label: 'Cerrada',
  },
  'Cambio de departamento': {
    icon: Building2,
    color: 'text-blue-600 bg-blue-100',
    label: 'Cambio de departamento',
  },
  'Creación': {
    icon: FileText,
    color: 'text-blue-600 bg-blue-100',
    label: 'Creación',
  },
  'Cambio de estado': {
    icon: Clock,
    color: 'text-purple-600 bg-purple-100',
    label: 'Cambio de estado',
  },
  'Aprobación': {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
    label: 'Aprobación',
  },
  'Rechazo': {
    icon: XCircle,
    color: 'text-red-600 bg-red-100',
    label: 'Rechazo',
  },
  'Finalización': {
    icon: Flag,
    color: 'text-gray-600 bg-gray-100',
    label: 'Finalización',
  },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistorialTimeline({ historial, className }: HistorialTimelineProps) {
  const sortedHistorial = [...historial].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  if (sortedHistorial.length === 0) {
    return (
      <div className={cn('py-8 text-center text-sm text-muted-foreground', className)}>
        No hay historial disponible.
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', className)}>
      {sortedHistorial.map((entry, index) => {
        const config = accionConfig[entry.accion] || {
          icon: Clock,
          color: 'text-gray-600 bg-gray-100',
          label: entry.accion,
        }
        const Icon = config.icon
        const isLast = index === sortedHistorial.length - 1

        return (
          <div key={entry.id} className="relative pb-6 pl-8">
            {!isLast && (
              <div className="absolute bottom-0 left-3 top-8 w-0.5 bg-border" />
            )}

            <div
              className={cn(
                'absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full',
                config.color
              )}
            >
              <Icon className="h-3 w-3" aria-hidden="true" focusable="false" />
            </div>

            <div className="rounded-lg border bg-card p-3">
              <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-foreground">
                  {entry.descripcion}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.fecha)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {config.label} · Por: {entry.usuario}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default HistorialTimeline
