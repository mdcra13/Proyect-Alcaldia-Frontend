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

const KNOWN_CORRUPT_TEXT: Array<[RegExp, string]> = [
  [/Direcci(?:\\00F3|F3|\?\?|@)n de Tecnolog(?:\\00ED|ED|\?\?|@)a de la Informaci(?:\\00F3|F3|\?\?|@)n/gi, 'Dirección de Tecnología de la Información'],
  [/Secretar(?:\\00ED|ED|\?\?|@)a General/gi, 'Secretaría General'],
  [/Tesorer(?:\\00ED|ED|\?\?|@)a Municipal/gi, 'Tesorería Municipal'],
  [/Obraw y Construcciones/gi, 'Obras y Construcciones'],
]

function mojibakeScore(value: string) {
  return (value.match(/[ÃÂð�]/g) ?? []).length
}

function repairUtf8ReadAsLatin1(value: string) {
  if (!/[ÃÂð]/.test(value)) return value
  const codePoints = Array.from(value, character => character.charCodeAt(0))
  if (codePoints.some(codePoint => codePoint > 255)) return value

  try {
    const repaired = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(codePoints))
    return mojibakeScore(repaired) < mojibakeScore(value) ? repaired : value
  } catch {
    return value
  }
}

/** Repara formatos heredados sin modificar texto Unicode que ya es válido. */
export function decodeText(text: string | null | undefined): string {
  if (!text) return ''
  let result = text

  for (const [pattern, replacement] of KNOWN_CORRUPT_TEXT) {
    result = result.replace(pattern, replacement)
  }

  // Siempre son dos ceros y exactamente dos dígitos hexadecimales. Un
  // cuantificador variable consumiría la "a" de textos como "\\00EDa".
  result = result.replace(/\\00([0-9a-f]{2})/gi, (_, code: string) =>
    String.fromCharCode(Number.parseInt(code, 16))
  )
  result = result.replace(/\\u([0-9a-f]{4})/gi, (_, code: string) =>
    String.fromCharCode(Number.parseInt(code, 16))
  )
  result = result.replace(/\\x([0-9a-f]{2})/gi, (_, code: string) =>
    String.fromCharCode(Number.parseInt(code, 16))
  )
  result = result.replace(/[\x00]/g, '')

  if (/%[0-9a-f]{2}/i.test(result)) {
    try {
      result = decodeURIComponent(result)
    } catch {
      // Conserva entradas parcialmente codificadas en vez de perder texto.
    }
  }

  return repairUtf8ReadAsLatin1(result).normalize('NFC')
}

export function normalizeDepartamentoNombre(name: string | null | undefined): string {
  const result = decodeText(name).replace(/\s+/g, ' ').trim()
  const key = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/\s+/g, '')

  const canonicalNames: Record<string, string> = {
    tesoreriamunicipal: 'Tesorería Municipal',
    secretariageneral: 'Secretaría General',
    secretariadegeneral: 'Secretaría General',
    despachodelalcalde: 'Despacho del Alcalde',
    direcciondetecnologiadelainformacion: 'Dirección de Tecnología de la Información',
    obrasyconstrucciones: 'Obras y Construcciones',
  }
  return canonicalNames[key] ?? result
}

const CATEGORIA_LABELS: Record<SolicitudCategoria, string> = {
  salud: 'Salud',
  educacion: 'Educación',
  familiar: 'Familiar',
  comunidad: 'Comunidad',
}

interface SolicitudFilterValues {
  searchQuery: string
  identificadorQuery?: string
  estado: SolicitudEstadoFiltro
  departamento: string
  categoria: SolicitudCategoria | 'todos'
  prioridad: SolicitudPrioridad | 'todos'
  fechaDesde: string
  fechaHasta: string
}

interface FilterSolicitudesOptions { subidoPorId?: string }

function matchesEstadoFilter(solicitud: Solicitud, estado: SolicitudEstadoFiltro) {
  if (estado === 'todos') return true
  if (estado === 'pendientes') return ['received', 'assigned_to_department', 'in_review'].includes(solicitud.estado)
  if (estado === 'en_proceso') return ['assigned_to_department', 'in_review', 'approved_by_department', 'awaiting_mayor_signature', 'returned_to_department'].includes(solicitud.estado)
  if (estado === 'aprobado') return ['approved_by_department', 'awaiting_mayor_signature', 'signed', 'closed'].includes(solicitud.estado)
  if (estado === 'declinado') return ['rejected_by_department', 'rejected_by_mayor_office'].includes(solicitud.estado)
  return solicitud.estado === estado
}

export function filterSolicitudes(
  solicitudes: Solicitud[],
  filters: SolicitudFilterValues,
  options: FilterSolicitudesOptions = {}
) {
  return solicitudes
    .filter(solicitud => {
      if (options.subidoPorId && solicitud.subidoPorId !== options.subidoPorId) return false
      if (filters.identificadorQuery?.trim()) {
        const query = filters.identificadorQuery.toLowerCase()
        if (!solicitud.radicado.toLowerCase().includes(query)) return false
      }
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch = solicitud.radicado.toLowerCase().includes(query) || solicitud.titulo.toLowerCase().includes(query) || solicitud.solicitante.toLowerCase().includes(query) || solicitud.identificacion.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      if (!matchesEstadoFilter(solicitud, filters.estado)) return false
      if (filters.departamento !== 'todos' && solicitud.departamentoId !== filters.departamento) return false
      if (filters.categoria !== 'todos' && solicitud.categoria !== filters.categoria) return false
      if (filters.prioridad !== 'todos' && solicitud.prioridad !== filters.prioridad) return false
      if (filters.fechaDesde && solicitud.fechaSolicitud < filters.fechaDesde) return false
      if (filters.fechaHasta && solicitud.fechaSolicitud > filters.fechaHasta) return false
      return true
    })
    .sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())
}

export function exportToCSV(solicitudes: Solicitud[], filename = 'solicitudes.csv'): void {
  const headers = ['# Código de seguimiento', 'Solicitante', 'Categoría', 'Departamento', 'Prioridad', 'Fecha solicitud', 'Fecha límite', 'Subido por', 'Estado']
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
  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
