import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  ESTADO_CONFIG,
  PRIORIDAD_LABELS,
  type Solicitud,
  type SolicitudCategoria,
  type SolicitudEstadoFiltro,
  type SolicitudPrioridad,
} from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CATEGORIA_LABELS: Record<SolicitudCategoria, string> = {
  salud: 'Salud',
  educacion: 'Educación',
  familiar: 'Familiar',
  comunidad: 'Comunidad',
}

interface SolicitudFilterValues {
  searchQuery: string
  estado: SolicitudEstadoFiltro
  departamento: string
  categoria: SolicitudCategoria | 'todos'
  prioridad: SolicitudPrioridad | 'todos'
  fechaDesde: string
  fechaHasta: string
}

interface FilterSolicitudesOptions {
  subidoPorId?: string
}

function matchesEstadoFilter(solicitud: Solicitud, estado: SolicitudEstadoFiltro) {
  if (estado === 'todos') return true

  if (estado === 'pendientes') {
    return ['received', 'assigned_to_department', 'in_review'].includes(
      solicitud.estado
    )
  }

  if (estado === 'en_proceso') {
    return [
      'assigned_to_department',
      'in_review',
      'approved_by_department',
      'awaiting_mayor_signature',
      'returned_to_department',
    ].includes(solicitud.estado)
  }

  if (estado === 'aprobado') {
    return [
      'approved_by_department',
      'awaiting_mayor_signature',
      'signed',
      'closed',
    ].includes(solicitud.estado)
  }

  if (estado === 'declinado') {
    return ['rejected_by_department', 'rejected_by_mayor_office'].includes(
      solicitud.estado
    )
  }

  return solicitud.estado === estado
}

export function filterSolicitudes(
  solicitudes: Solicitud[],
  filters: SolicitudFilterValues,
  options: FilterSolicitudesOptions = {}
) {
  return solicitudes
    .filter(solicitud => {
      if (options.subidoPorId && solicitud.subidoPorId !== options.subidoPorId) {
        return false
      }

      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase()

        const matchesSearch =
          solicitud.radicado.toLowerCase().includes(query) ||
          solicitud.titulo.toLowerCase().includes(query) ||
          solicitud.solicitante.toLowerCase().includes(query) ||
          solicitud.identificacion.toLowerCase().includes(query)

        if (!matchesSearch) return false
      }

      if (!matchesEstadoFilter(solicitud, filters.estado)) return false

      if (
        filters.departamento !== 'todos' &&
        solicitud.departamentoId !== filters.departamento
      ) {
        return false
      }

      if (
        filters.categoria !== 'todos' &&
        solicitud.categoria !== filters.categoria
      ) {
        return false
      }

      if (
        filters.prioridad !== 'todos' &&
        solicitud.prioridad !== filters.prioridad
      ) {
        return false
      }

      if (filters.fechaDesde && solicitud.fechaSolicitud < filters.fechaDesde) {
        return false
      }

      if (filters.fechaHasta && solicitud.fechaSolicitud > filters.fechaHasta) {
        return false
      }

      return true
    })
    .sort(
      (a, b) =>
        new Date(b.fechaSolicitud).getTime() -
        new Date(a.fechaSolicitud).getTime()
    )
}

export function exportToCSV(
  solicitudes: Solicitud[],
  filename = 'solicitudes.csv'
): void {
  const headers = [
    '# Radicado',
    'Solicitante',
    'Categoría',
    'Departamento',
    'Prioridad',
    'Fecha solicitud',
    'Fecha límite',
    'Subido por',
    'Estado',
  ]

  const rows = solicitudes.map(solicitud => [
    solicitud.radicado,
    solicitud.solicitante,
    CATEGORIA_LABELS[solicitud.categoria] ?? solicitud.categoria,
    solicitud.departamento?.nombre ?? 'Sin asignar',
    PRIORIDAD_LABELS[solicitud.prioridad] ?? solicitud.prioridad,
    solicitud.fechaSolicitud,
    solicitud.fechaLimite,
    solicitud.subidoPor,
    ESTADO_CONFIG[solicitud.estado]?.label ?? solicitud.estado,
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', filename)

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}