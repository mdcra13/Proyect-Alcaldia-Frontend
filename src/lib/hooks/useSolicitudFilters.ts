import { useSearchParams } from 'react-router-dom'
import type {
  SolicitudCategoria,
  SolicitudEstadoFiltro,
  SolicitudPrioridad,
} from '@/lib/types'

export type SolicitudFilterKey =
  | 'q'
  | 'identificador'
  | 'estado'
  | 'departamento'
  | 'categoria'
  | 'prioridad'
  | 'desde'
  | 'hasta'
  | 'page'

function getParam(
  searchParams: URLSearchParams,
  key: SolicitudFilterKey,
  fallback = 'todos',
) {
  return searchParams.get(key) || fallback
}

export function useSolicitudFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const searchQuery = searchParams.get('q') || ''
  const identificadorQuery = searchParams.get('identificador') || ''
  const estado = getParam(searchParams, 'estado') as SolicitudEstadoFiltro
  const departamento = getParam(searchParams, 'departamento')
  const categoria = getParam(searchParams, 'categoria') as SolicitudCategoria | 'todos'
  const prioridad = getParam(searchParams, 'prioridad') as SolicitudPrioridad | 'todos'
  const fechaDesde = searchParams.get('desde') || ''
  const fechaHasta = searchParams.get('hasta') || ''
  const currentPage = Number(searchParams.get('page') || '1')

  const updateFilter = (key: SolicitudFilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)

    if (!value || value === 'todos') {
      next.delete(key)
    } else {
      next.set(key, value)
    }

    if (key !== 'page') {
      next.delete('page')
    }

    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const activeFiltersCount = [
    searchQuery,
    identificadorQuery,
    estado !== 'todos',
    departamento !== 'todos',
    categoria !== 'todos',
    prioridad !== 'todos',
    fechaDesde,
    fechaHasta,
  ].filter(Boolean).length

  return {
    searchQuery,
    identificadorQuery,
    estado,
    departamento,
    categoria,
    prioridad,
    fechaDesde,
    fechaHasta,
    currentPage,
    updateFilter,
    clearFilters,
    activeFiltersCount,
    hasActiveFilters: activeFiltersCount > 0,
  }
}