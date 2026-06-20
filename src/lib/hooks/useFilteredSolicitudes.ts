import { useMemo } from 'react'
import type { Solicitud } from '@/lib/types'

interface FilterParams {
  searchQuery: string
  estado: string
  categoria: string
  prioridad: string
  fechaDesde: string
  fechaHasta: string
}

type SortBy = 'fechaLimite-asc' | 'fechaSolicitud-desc'

export function useFilteredSolicitudes(
  baseSolicitudes: Solicitud[],
  filters: FilterParams,
  sortBy: SortBy
) {
  const { searchQuery, estado, categoria, prioridad, fechaDesde, fechaHasta } = filters

  return useMemo(() => {
    let results = [...baseSolicitudes]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(solicitud =>
        solicitud.radicado.toLowerCase().includes(query) ||
        solicitud.titulo.toLowerCase().includes(query) ||
        solicitud.solicitante.toLowerCase().includes(query) ||
        solicitud.identificacion.toLowerCase().includes(query)
      )
    }

    if (estado !== 'todos') {
      results = results.filter(solicitud => solicitud.estado === estado)
    }

    if (categoria !== 'todos') {
      results = results.filter(solicitud => solicitud.categoria === categoria)
    }

    if (prioridad !== 'todos') {
      results = results.filter(solicitud => solicitud.prioridad === prioridad)
    }

    if (fechaDesde) {
      results = results.filter(solicitud => solicitud.fechaLimite >= fechaDesde)
    }

    if (fechaHasta) {
      results = results.filter(solicitud => solicitud.fechaLimite <= fechaHasta)
    }

    if (sortBy === 'fechaLimite-asc') {
      results.sort(
        (a, b) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime()
      )
    } else {
      results.sort(
        (a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      )
    }

    return results
  }, [baseSolicitudes, searchQuery, estado, categoria, prioridad, fechaDesde, fechaHasta, sortBy])
}