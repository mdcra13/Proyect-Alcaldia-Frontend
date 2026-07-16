import { useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  PenLine,
  Search,
  Undo2,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { CambiarEstadoModal } from '@/components/shared/CambiarEstadoModal'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { FechaLimiteBadge } from '@/components/shared/FechaLimiteBadge'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import {
  ESTADO_CONFIG,
  PRIORIDAD_LABELS,
  type Solicitud,
  type SolicitudCategoria,
  type SolicitudEstado,
  type SolicitudPrioridad,
} from '@/lib/types'

const ITEMS_PER_PAGE = 10

const ALCALDE_VISIBLE_ESTADOS: SolicitudEstado[] = [
  'approved_by_department',
  'awaiting_mayor_signature',
  'signed',
]

type FilterKey =
  | 'q'
  | 'identificador'
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

export default function AlcaldeNotas() {
  const { solicitudes } = useSolicitudesStore()
  const { departamentos } = useDepartamentosStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)
  const [presetEstado, setPresetEstado] = useState<SolicitudEstado | undefined>()

  const searchQuery = searchParams.get('q') || ''
  const identificadorQuery = searchParams.get('identificador') || ''
  const filterEstado = getParam(searchParams, 'estado') as SolicitudEstado | 'todos'
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

    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const baseSolicitudes = useMemo(() => {
    return solicitudes.filter((solicitud) =>
      ALCALDE_VISIBLE_ESTADOS.includes(solicitud.estado)
    )
  }, [solicitudes])

  const filteredSolicitudes = useMemo(() => {
    let results = [...baseSolicitudes]

    if (identificadorQuery) {
      const query = identificadorQuery.toLowerCase()
      results = results.filter((solicitud) =>
        solicitud.radicado.toLowerCase().includes(query)
      )
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter((solicitud) =>
        solicitud.radicado.toLowerCase().includes(query) ||
        solicitud.titulo.toLowerCase().includes(query) ||
        solicitud.solicitante.toLowerCase().includes(query)
      )
    }

    if (filterEstado !== 'todos') {
      results = results.filter((solicitud) => solicitud.estado === filterEstado)
    }

    if (filterDepartamento !== 'todos') {
      results = results.filter((solicitud) => solicitud.departamentoId === filterDepartamento)
    }

    if (filterCategoria !== 'todos') {
      results = results.filter((solicitud) => solicitud.categoria === filterCategoria)
    }

    if (filterPrioridad !== 'todos') {
      results = results.filter((solicitud) => solicitud.prioridad === filterPrioridad)
    }

    if (fechaDesde) {
      results = results.filter((solicitud) => solicitud.fechaSolicitud >= fechaDesde)
    }

    if (fechaHasta) {
      results = results.filter((solicitud) => solicitud.fechaSolicitud <= fechaHasta)
    }

    return results.sort(
      (a, b) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime()
    )
  }, [
    baseSolicitudes,
    identificadorQuery,
    searchQuery,
    filterEstado,
    filterDepartamento,
    filterCategoria,
    filterPrioridad,
    fechaDesde,
    fechaHasta,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredSolicitudes.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  )

  const activeFiltersCount = [
    searchQuery,
    identificadorQuery,
    filterEstado !== 'todos',
    filterDepartamento !== 'todos',
    filterCategoria !== 'todos',
    filterPrioridad !== 'todos',
    fechaDesde,
    fechaHasta,
  ].filter(Boolean).length

  const hasActiveFilters = activeFiltersCount > 0

  const handleViewDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowPreviewModal(true)
  }

  const handleAlcaldeAction = (solicitud: Solicitud, estado: SolicitudEstado) => {
    setSelectedSolicitud(solicitud)
    setPresetEstado(estado)
    setShowChangeStatusModal(true)
  }

  const handlePreviewApprove = () => {
    if (!selectedSolicitud) return
    setShowPreviewModal(false)

    if (selectedSolicitud.estado === 'approved_by_department') {
      handleAlcaldeAction(selectedSolicitud, 'awaiting_mayor_signature')
      return
    }

    if (selectedSolicitud.estado === 'awaiting_mayor_signature') {
      handleAlcaldeAction(selectedSolicitud, 'signed')
    }
  }

  const handlePreviewDecline = () => {
    if (!selectedSolicitud || selectedSolicitud.estado === 'signed') return

    setShowPreviewModal(false)
    handleAlcaldeAction(selectedSolicitud, 'returned_to_department')
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">
            Listado de Notas
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredSolicitudes.length} de {baseSolicitudes.length} notas para revisión de Alcaldía
          </p>
        </div>

        <section className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 font-medium">
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Buscar por identificador, título o solicitante..."
                value={searchQuery}
                onChange={(event) => updateFilter('q', event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Filtrar por identificador..."
                value={identificadorQuery}
                onChange={(event) => updateFilter('identificador', event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <select
              aria-label="Estado"
              value={filterEstado}
              onChange={(event) => updateFilter('estado', event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todos">Todos los estados</option>
              {ALCALDE_VISIBLE_ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {ESTADO_CONFIG[estado].label}
                </option>
              ))}
            </select>

            <select
              aria-label="Departamento"
              value={filterDepartamento}
              onChange={(event) => updateFilter('departamento', event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todos">Todos los departamentos</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.nombre}
                </option>
              ))}
            </select>

            <select
              aria-label="CategorÃ­a"
              value={filterCategoria}
              onChange={(event) => updateFilter('categoria', event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todos">Todas las categorías</option>
              {Object.entries(CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Prioridad"
              value={filterPrioridad}
              onChange={(event) => updateFilter('prioridad', event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todos">Todas las prioridades</option>
              {Object.entries(PRIORIDAD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => updateFilter('desde', event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Fecha desde"
            />

            <input
              type="date"
              value={fechaHasta}
              onChange={(event) => updateFilter('hasta', event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Fecha hasta"
            />
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

        <section className="rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground">Identificador</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Identificador</th>
                  <th className="hidden p-4 text-left font-medium text-muted-foreground lg:table-cell">
                    Departamento
                  </th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Fecha límite</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="hidden p-4 text-left font-medium text-muted-foreground md:table-cell">
                    Subido por
                  </th>
                  <th className="p-4 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {paginatedSolicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No hay notas para Alcaldía con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedSolicitudes.map((solicitud) => {
                    const canApprove = solicitud.estado === 'approved_by_department'
                    const canReturn =
                      solicitud.estado === 'approved_by_department' ||
                      solicitud.estado === 'awaiting_mayor_signature'
                    const canSign = solicitud.estado === 'awaiting_mayor_signature'
                    const isSigned = solicitud.estado === 'signed'

                    return (
                      <tr key={solicitud.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="p-4">
                          <span className="font-mono text-sm">{solicitud.radicado}</span>
                        </td>

                        <td className="p-4">
                          <p className="max-w-[240px] truncate font-medium">
                            {solicitud.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {solicitud.subidoPor}
                          </p>
                        </td>

                        <td className="hidden p-4 lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {solicitud.departamento?.nombre ?? 'Sin asignar'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
                        </td>

                        <td className="p-4">
                          <EstadoBadge estado={solicitud.estado} />
                        </td>

                        <td className="hidden p-4 md:table-cell">
                          <span className="text-sm">{solicitud.subidoPor}</span>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewDetail(solicitud)}
                              className="icon-button hover:bg-secondary"
                              title="Ver detalle"
                              aria-label={`Ver detalle de ${solicitud.radicado}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleAlcaldeAction(solicitud, 'awaiting_mayor_signature')
                              }
                              disabled={!canApprove}
                              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                              title="Aprobar solicitud"
                              aria-label={`Aprobar ${solicitud.radicado}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="hidden xl:inline">Aprobar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleAlcaldeAction(solicitud, 'returned_to_department')
                              }
                              disabled={!canReturn}
                              className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
                              title="Rechazar y devolver al departamento"
                              aria-label={`Rechazar y devolver ${solicitud.radicado}`}
                            >
                              <Undo2 className="h-4 w-4" />
                              <span className="hidden xl:inline">Rechazar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAlcaldeAction(solicitud, 'signed')}
                              disabled={!canSign}
                              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                                isSigned
                                  ? 'cursor-not-allowed bg-gray-200 text-gray-600'
                                  : canSign
                                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                                    : 'cursor-not-allowed bg-gray-100 text-gray-500'
                              }`}
                              title={isSigned ? 'Ya fue firmada' : 'Firmar solicitud'}
                              aria-label={isSigned ? `${solicitud.radicado} ya fue firmada` : `Firmar ${solicitud.radicado}`}
                            >
                              <PenLine className="h-4 w-4" />
                              <span className="hidden xl:inline">
                                {isSigned ? 'Firmada' : 'Firmar'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredSolicitudes.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredSolicitudes.length)} de{' '}
                {filteredSolicitudes.length} notas
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateFilter('page', String(safeCurrentPage - 1))}
                  disabled={safeCurrentPage === 1}
                  className="icon-button border border-border disabled:opacity-50"
                  aria-label="PÃ¡gina anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm">
                  Página {safeCurrentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => updateFilter('page', String(safeCurrentPage + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="icon-button border border-border disabled:opacity-50"
                  aria-label="PÃ¡gina siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {selectedSolicitud && (
          <DocumentPreviewModal
            solicitud={selectedSolicitud}
            open={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            onApprove={handlePreviewApprove}
            onDecline={handlePreviewDecline}
          />
        )}

        {selectedSolicitud && (
          <CambiarEstadoModal
            solicitud={selectedSolicitud}
            open={showChangeStatusModal}
            onOpenChange={(open) => {
              setShowChangeStatusModal(open)
              if (!open) setPresetEstado(undefined)
            }}
            presetEstado={presetEstado}
          />
        )}
      </div>
    </AppLayout>
  )
}
