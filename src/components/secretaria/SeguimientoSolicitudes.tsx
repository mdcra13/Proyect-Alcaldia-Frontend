import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  History,
  Search,
  X,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import CambiarDepartamentoModal from '@/components/shared/CambiarDepartamentoModal'
import EstadoBadge from '@/components/shared/EstadoBadge'
import FechaLimiteBadge from '@/components/shared/FechaLimiteBadge'
import HistorialTimeline from '@/components/shared/HistorialTimeline'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import {
  ESTADO_CONFIG,
  PRIORIDAD_LABELS,
  type Solicitud,
  type SolicitudCategoria,
  type SolicitudEstadoFiltro,
  type SolicitudPrioridad,
} from '@/lib/types'

const ITEMS_PER_PAGE = 10

type FilterKey =
  | 'q'
  | 'estado'
  | 'departamento'
  | 'categoria'
  | 'prioridad'
  | 'desde'
  | 'hasta'
  | 'page'

function getParam(searchParams: URLSearchParams, key: FilterKey, fallback = 'todos') {
  return searchParams.get(key) || fallback
}

function exportRowsToCSV(filename: string, rows: string[][]) {
  const escapeCell = (cell: string) => `"${cell.replaceAll('"', '""')}"`
  const csvContent = rows.map(row => row.map(escapeCell).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export default function SeguimientoSolicitudes() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [viewSolicitud, setViewSolicitud] = useState<Solicitud | null>(null)
  const [changeDeptSolicitud, setChangeDeptSolicitud] = useState<Solicitud | null>(null)
  const [historialSolicitud, setHistorialSolicitud] = useState<Solicitud | null>(null)

  const solicitudes = useSolicitudesStore(state => state.solicitudes)
  const departamentos = useDepartamentosStore(state => state.departamentos)

  const searchQuery = searchParams.get('q') || ''
  const filterEstado = getParam(searchParams, 'estado') as SolicitudEstadoFiltro
  const filterDepartamento = getParam(searchParams, 'departamento')
  const filterCategoria = getParam(searchParams, 'categoria') as SolicitudCategoria | 'todos'
  const filterPrioridad = getParam(searchParams, 'prioridad') as SolicitudPrioridad | 'todos'
  const fechaDesde = searchParams.get('desde') || ''
  const fechaHasta = searchParams.get('hasta') || ''
  const currentPage = Number(searchParams.get('page') || '1')

  const updateFilter = (key: FilterKey, value: string) => {
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

  const getDepartamentoNombre = (departamentoId?: string) => {
    if (!departamentoId) return 'Sin asignar'

    const departamento = departamentos.find(item => item.id === departamentoId)

    return departamento?.nombre ?? 'Sin asignar'
  }

  const filteredSolicitudes = useMemo(() => {
    let results = [...solicitudes]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()

      results = results.filter(solicitud =>
        solicitud.radicado.toLowerCase().includes(query) ||
        solicitud.titulo.toLowerCase().includes(query) ||
        solicitud.solicitante.toLowerCase().includes(query) ||
        solicitud.identificacion.toLowerCase().includes(query)
      )
    }

    if (filterEstado !== 'todos') {
      if (filterEstado === 'pendientes') {
        results = results.filter(solicitud =>
          ['received', 'assigned_to_department', 'in_review'].includes(
            solicitud.estado
          )
        )
      } else if (filterEstado === 'en_proceso') {
        results = results.filter(solicitud =>
          [
            'assigned_to_department',
            'in_review',
            'approved_by_department',
            'awaiting_mayor_signature',
            'returned_to_department',
          ].includes(solicitud.estado)
        )
      } else if (filterEstado === 'aprobado') {
        results = results.filter(solicitud =>
          ['approved_by_department', 'awaiting_mayor_signature', 'signed', 'closed'].includes(
            solicitud.estado
          )
        )
      } else if (filterEstado === 'declinado') {
        results = results.filter(solicitud =>
          ['rejected_by_department', 'rejected_by_mayor_office'].includes(
            solicitud.estado
          )
        )
      } else {
        results = results.filter(solicitud => solicitud.estado === filterEstado)
      }
    }

    if (filterDepartamento !== 'todos') {
      results = results.filter(
        solicitud => solicitud.departamentoId === filterDepartamento
      )
    }

    if (filterCategoria !== 'todos') {
      results = results.filter(solicitud => solicitud.categoria === filterCategoria)
    }

    if (filterPrioridad !== 'todos') {
      results = results.filter(solicitud => solicitud.prioridad === filterPrioridad)
    }

    if (fechaDesde) {
      results = results.filter(solicitud => solicitud.fechaSolicitud >= fechaDesde)
    }

    if (fechaHasta) {
      results = results.filter(solicitud => solicitud.fechaSolicitud <= fechaHasta)
    }

    return results.sort(
      (a, b) =>
        new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
    )
  }, [
    solicitudes,
    searchQuery,
    filterEstado,
    filterDepartamento,
    filterCategoria,
    filterPrioridad,
    fechaDesde,
    fechaHasta,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredSolicitudes.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  )

  const activeFiltersCount = [
    searchQuery,
    filterEstado !== 'todos',
    filterDepartamento !== 'todos',
    filterCategoria !== 'todos',
    filterPrioridad !== 'todos',
    fechaDesde,
    fechaHasta,
  ].filter(Boolean).length

  const hasActiveFilters = activeFiltersCount > 0

  const handleExport = () => {
    const headers = [
      'Radicado',
      'Solicitante',
      'Identificación',
      'Categoría',
      'Departamento',
      'Prioridad',
      'Fecha solicitud',
      'Fecha límite',
      'Estado',
    ]

    const rows = filteredSolicitudes.map(solicitud => [
      solicitud.radicado,
      solicitud.solicitante,
      solicitud.identificacion,
      CATEGORIES[solicitud.categoria]?.label ?? solicitud.categoria,
      getDepartamentoNombre(solicitud.departamentoId),
      PRIORIDAD_LABELS[solicitud.prioridad] ?? solicitud.prioridad,
      solicitud.fechaSolicitud,
      solicitud.fechaLimite,
      ESTADO_CONFIG[solicitud.estado]?.label ?? solicitud.estado,
    ])

    exportRowsToCSV(
      `solicitudes_${new Date().toISOString().split('T')[0]}.csv`,
      [headers, ...rows]
    )
  }

  return (
    <AppLayout title="Seguimiento de Solicitudes">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Seguimiento de Solicitudes
            </h2>
            <p className="text-muted-foreground">
              {filteredSolicitudes.length} solicitudes encontradas
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Download className="h-5 w-5" />
            <span>Exportar CSV</span>
          </button>
        </div>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Filtros</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <label htmlFor="seguimiento-search" className="sr-only">
                Buscar solicitudes
              </label>
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="seguimiento-search"
                type="text"
                placeholder="Buscar por radicado, título, solicitante o identificación..."
                value={searchQuery}
                onChange={event => updateFilter('q', event.target.value)}
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="seguimiento-estado" className="sr-only">
                Estado
              </label>
              <select
                id="seguimiento-estado"
                value={filterEstado}
                onChange={event => updateFilter('estado', event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendientes">Pendientes</option>
                <option value="en_proceso">En proceso</option>
                <option value="aprobado">Aprobadas</option>
                <option value="declinado">Declinadas</option>
                {Object.entries(ESTADO_CONFIG).map(([estado, config]) => (
                  <option key={estado} value={estado}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seguimiento-departamento" className="sr-only">
                Departamento
              </label>
              <select
                id="seguimiento-departamento"
                value={filterDepartamento}
                onChange={event => updateFilter('departamento', event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="todos">Todos los departamentos</option>
                {departamentos.map(departamento => (
                  <option key={departamento.id} value={departamento.id}>
                    {departamento.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seguimiento-categoria" className="sr-only">
                Categoría
              </label>
              <select
                id="seguimiento-categoria"
                value={filterCategoria}
                onChange={event => updateFilter('categoria', event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="todos">Todas las categorías</option>
                {Object.entries(CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seguimiento-prioridad" className="sr-only">
                Prioridad
              </label>
              <select
                id="seguimiento-prioridad"
                value={filterPrioridad}
                onChange={event => updateFilter('prioridad', event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="todos">Todas las prioridades</option>
                {Object.entries(PRIORIDAD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seguimiento-desde" className="sr-only">
                Fecha desde
              </label>
              <input
                id="seguimiento-desde"
                type="date"
                value={fechaDesde}
                onChange={event => updateFilter('desde', event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="seguimiento-hasta" className="sr-only">
                Fecha hasta
              </label>
              <input
                id="seguimiento-hasta"
                type="date"
                value={fechaHasta}
                onChange={event => updateFilter('hasta', event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Hay {activeFiltersCount} filtro(s) activo(s).
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-secondary"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        {filteredSolicitudes.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              No se encontraron solicitudes
            </h3>
            <p className="mt-2 text-muted-foreground">
              No hay solicitudes que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="table-th text-left"># Radicado</th>
                    <th className="table-th text-left">Solicitante</th>
                    <th className="table-th text-left">Departamento</th>
                    <th className="table-th text-left">Prioridad</th>
                    <th className="table-th text-left">Fecha límite</th>
                    <th className="table-th text-left">Estado</th>
                    <th className="table-th text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSolicitudes.map(solicitud => (
                    <tr
                      key={solicitud.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="table-td">
                        <p className="font-medium">{solicitud.radicado}</p>
                        <p className="text-xs text-muted-foreground">
                          {solicitud.fechaSolicitud}
                        </p>
                      </td>

                      <td className="table-td">
                        <p className="font-medium">{solicitud.solicitante}</p>
                        <p className="text-xs text-muted-foreground">
                          {solicitud.identificacion}
                        </p>
                      </td>

                      <td className="table-td">
                        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                          {solicitud.departamento?.nombre ??
                            getDepartamentoNombre(solicitud.departamentoId)}
                        </span>
                      </td>

                      <td className="table-td">
                        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                          {PRIORIDAD_LABELS[solicitud.prioridad]}
                        </span>
                      </td>

                      <td className="table-td">
                        <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
                      </td>

                      <td className="table-td">
                        <EstadoBadge estado={solicitud.estado} />
                      </td>

                      <td className="table-td">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewSolicitud(solicitud)}
                            className="icon-button hover:bg-secondary"
                            title="Ver detalle"
                            aria-label={`Ver detalle de ${solicitud.radicado}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setHistorialSolicitud(solicitud)}
                            className="icon-button hover:bg-secondary"
                            title="Ver historial"
                            aria-label={`Ver historial de ${solicitud.radicado}`}
                          >
                            <History className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setChangeDeptSolicitud(solicitud)}
                            className="icon-button hover:bg-secondary"
                            title="Cambiar departamento"
                            aria-label={`Cambiar departamento de ${solicitud.radicado}`}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSolicitudes.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between border-t p-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                    {Math.min(
                      safeCurrentPage * ITEMS_PER_PAGE,
                      filteredSolicitudes.length
                    )}{' '}
                    de {filteredSolicitudes.length} solicitudes
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateFilter('page', String(safeCurrentPage - 1))}
                      disabled={safeCurrentPage === 1}
                      className="icon-button border border-border disabled:opacity-50"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="text-sm text-muted-foreground">
                      Página {safeCurrentPage} de {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => updateFilter('page', String(safeCurrentPage + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="icon-button border border-border disabled:opacity-50"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 lg:hidden">
              {paginatedSolicitudes.map(solicitud => (
                <div
                  key={solicitud.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="font-medium text-primary">
                      {solicitud.radicado}
                    </span>
                    <EstadoBadge estado={solicitud.estado} />
                  </div>

                  <p className="mb-1 font-medium text-foreground">
                    {solicitud.solicitante}
                  </p>

                  <p className="mb-3 text-sm text-muted-foreground">
                    {solicitud.identificacion}
                  </p>

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                      {solicitud.departamento?.nombre ??
                        getDepartamentoNombre(solicitud.departamentoId)}
                    </span>

                    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                      {PRIORIDAD_LABELS[solicitud.prioridad]}
                    </span>

                    <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewSolicitud(solicitud)}
                      className="mobile-card-btn flex-1 border border-border bg-card text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistorialSolicitud(solicitud)}
                      className="mobile-card-btn border border-border bg-card text-foreground"
                      aria-label={`Ver historial de ${solicitud.radicado}`}
                    >
                      <History className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setChangeDeptSolicitud(solicitud)}
                      className="mobile-card-btn border border-border bg-card text-foreground"
                      aria-label={`Cambiar departamento de ${solicitud.radicado}`}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredSolicitudes.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <button
                    type="button"
                    onClick={() => updateFilter('page', String(safeCurrentPage - 1))}
                    disabled={safeCurrentPage === 1}
                    className="icon-button border border-border disabled:opacity-50"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="text-sm text-muted-foreground">
                    Página {safeCurrentPage} de {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateFilter('page', String(safeCurrentPage + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="icon-button border border-border disabled:opacity-50"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {viewSolicitud && (
          <DocumentPreviewModal
            open={Boolean(viewSolicitud)}
            solicitud={viewSolicitud}
            onClose={() => setViewSolicitud(null)}
          />
        )}

        {changeDeptSolicitud && (
          <CambiarDepartamentoModal
            solicitud={changeDeptSolicitud}
            open={Boolean(changeDeptSolicitud)}
            onOpenChange={open => {
              if (!open) setChangeDeptSolicitud(null)
            }}
            isFirstAssignment={changeDeptSolicitud.estado === 'received'}
          />
        )}

        {historialSolicitud && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
              <div className="flex items-start justify-between border-b border-border px-6 py-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    Historial de Cambios
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Solicitud {historialSolicitud.radicado}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setHistorialSolicitud(null)}
                  className="icon-button hover:bg-secondary"
                  aria-label="Cerrar historial"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <HistorialTimeline historial={historialSolicitud.historial} />
              </div>

              <div className="flex justify-end border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={() => setHistorialSolicitud(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}