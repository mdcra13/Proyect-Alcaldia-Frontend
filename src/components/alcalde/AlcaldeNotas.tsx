import { useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MessageSquareWarning,
  PenLine,
  Search,
  XCircle,
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
  'under_observation',
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
  const [showPreviewModal, setShowPreviewModal]       = useState(false)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)
  const [presetEstado, setPresetEstado]               = useState<SolicitudEstado | undefined>()

  const searchQuery        = searchParams.get('q') || ''
  const identificadorQuery = searchParams.get('identificador') || ''
  const filterEstado       = getParam(searchParams, 'estado') as SolicitudEstado | 'todos'
  const filterDepartamento = getParam(searchParams, 'departamento')
  const filterCategoria    = getParam(searchParams, 'categoria') as SolicitudCategoria | 'todos'
  const filterPrioridad    = getParam(searchParams, 'prioridad') as SolicitudPrioridad | 'todos'
  const fechaDesde         = searchParams.get('desde') || ''
  const fechaHasta         = searchParams.get('hasta') || ''
  const currentPage        = Number(searchParams.get('page') || '1')

  const updateFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'todos') next.delete(key)
    else next.set(key, value)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const clearFilters = () => setSearchParams({})

  const baseSolicitudes = useMemo(
    () => solicitudes.filter(s => ALCALDE_VISIBLE_ESTADOS.includes(s.estado)),
    [solicitudes],
  )

  const filteredSolicitudes = useMemo(() => {
    let results = [...baseSolicitudes]

    if (identificadorQuery) {
      const q = identificadorQuery.toLowerCase()
      results = results.filter(s => s.radicado.toLowerCase().includes(q))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(s =>
        s.radicado.toLowerCase().includes(q) ||
        s.titulo.toLowerCase().includes(q) ||
        s.solicitante.toLowerCase().includes(q),
      )
    }
    if (filterEstado !== 'todos')       results = results.filter(s => s.estado === filterEstado)
    if (filterDepartamento !== 'todos') results = results.filter(s => s.departamentoId === filterDepartamento)
    if (filterCategoria !== 'todos')    results = results.filter(s => s.categoria === filterCategoria)
    if (filterPrioridad !== 'todos')    results = results.filter(s => s.prioridad === filterPrioridad)
    if (fechaDesde) results = results.filter(s => s.fechaSolicitud >= fechaDesde)
    if (fechaHasta) results = results.filter(s => s.fechaSolicitud <= fechaHasta)

    return results.sort((a, b) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime())
  }, [baseSolicitudes, identificadorQuery, searchQuery, filterEstado, filterDepartamento, filterCategoria, filterPrioridad, fechaDesde, fechaHasta])

  const totalPages      = Math.max(1, Math.ceil(filteredSolicitudes.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  )

  const activeFiltersCount = [
    searchQuery, identificadorQuery,
    filterEstado !== 'todos', filterDepartamento !== 'todos',
    filterCategoria !== 'todos', filterPrioridad !== 'todos',
    fechaDesde, fechaHasta,
  ].filter(Boolean).length
  const hasActiveFilters = activeFiltersCount > 0

  /* ── Handlers ────────────────────────────────────────────── */

  const handleViewDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowPreviewModal(true)
  }

  const handleAlcaldeAction = (solicitud: Solicitud, estado: SolicitudEstado) => {
    setSelectedSolicitud(solicitud)
    setPresetEstado(estado)
    setShowChangeStatusModal(true)
  }

  // Desde DocumentPreviewModal: Aprobar avanza al siguiente estado positivo
  const handlePreviewApprove = () => {
    if (!selectedSolicitud) return
    setShowPreviewModal(false)
    if (selectedSolicitud.estado === 'approved_by_department') {
      handleAlcaldeAction(selectedSolicitud, 'awaiting_mayor_signature')
    } else if (selectedSolicitud.estado === 'awaiting_mayor_signature') {
      handleAlcaldeAction(selectedSolicitud, 'signed')
    }
  }

  // Desde DocumentPreviewModal: Declinar = rechazo definitivo
  const handlePreviewDecline = () => {
    if (!selectedSolicitud) return
    setShowPreviewModal(false)
    handleAlcaldeAction(selectedSolicitud, 'rejected_by_mayor_office')
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <AppLayout>
      <div className="space-y-6">

        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Listado de Notas</h1>
          <p className="text-sm text-muted-foreground">
            {filteredSolicitudes.length} de {baseSolicitudes.length} notas para revisión de Alcaldía
          </p>
        </div>

        {/* Filtros */}
        <section className="rounded-lg border border-border bg-card p-6" aria-label="Filtros">
          <div className="mb-4 flex items-center gap-2 font-medium">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
            {hasActiveFilters && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <label htmlFor="alcalde-search" className="sr-only">Buscar</label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="alcalde-search"
                type="search"
                placeholder="Buscar por radicado, título o solicitante..."
                value={searchQuery}
                onChange={e => updateFilter('q', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="relative sm:col-span-2">
              <label htmlFor="alcalde-identificador" className="sr-only">Filtrar por radicado</label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="alcalde-identificador"
                type="search"
                placeholder="Filtrar por radicado..."
                value={identificadorQuery}
                onChange={e => updateFilter('identificador', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label htmlFor="alcalde-estado" className="sr-only">Estado</label>
              <select id="alcalde-estado" value={filterEstado} onChange={e => updateFilter('estado', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="todos">Todos los estados</option>
                {ALCALDE_VISIBLE_ESTADOS.map(e => (
                  <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="alcalde-departamento" className="sr-only">Departamento</label>
              <select id="alcalde-departamento" value={filterDepartamento} onChange={e => updateFilter('departamento', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="todos">Todos los departamentos</option>
                {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="alcalde-categoria" className="sr-only">Categoría</label>
              <select id="alcalde-categoria" value={filterCategoria} onChange={e => updateFilter('categoria', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="todos">Todas las categorías</option>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="alcalde-prioridad" className="sr-only">Prioridad</label>
              <select id="alcalde-prioridad" value={filterPrioridad} onChange={e => updateFilter('prioridad', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="todos">Todas las prioridades</option>
                {Object.entries(PRIORIDAD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="alcalde-desde" className="sr-only">Fecha desde</label>
              <input id="alcalde-desde" type="date" value={fechaDesde}
                onChange={e => updateFilter('desde', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>

            <div>
              <label htmlFor="alcalde-hasta" className="sr-only">Fecha hasta</label>
              <input id="alcalde-hasta" type="date" value={fechaHasta}
                onChange={e => updateFilter('hasta', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-sm text-muted-foreground">Hay {activeFiltersCount} filtro(s) activo(s).</p>
              <button type="button" onClick={clearFilters}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-secondary">
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        {/* Tabla */}
        <section className="rounded-lg border border-border bg-card" aria-labelledby="alcalde-notas-title">
          <h2 id="alcalde-notas-title" className="sr-only">Listado de notas</h2>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Notas para revisión de Alcaldía">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Radicado</th>
                  <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Título</th>
                  <th scope="col" className="hidden p-4 text-left font-medium text-muted-foreground lg:table-cell">Departamento</th>
                  <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Fecha límite</th>
                  <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Estado</th>
                  <th scope="col" className="hidden p-4 text-left font-medium text-muted-foreground md:table-cell">Subido por</th>
                  <th scope="col" className="p-4 text-right font-medium text-muted-foreground">Acciones</th>
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
                  paginatedSolicitudes.map(solicitud => {
                    const canApprove         = solicitud.estado === 'approved_by_department'
                    const canSign            = solicitud.estado === 'awaiting_mayor_signature'
                    const canRequestChanges  = solicitud.estado === 'awaiting_mayor_signature' || solicitud.estado === 'approved_by_department'
                    const canRejectFinal     = solicitud.estado === 'awaiting_mayor_signature' || solicitud.estado === 'approved_by_department'
                    const isSigned           = solicitud.estado === 'signed'
                    const isUnderObservation = solicitud.estado === 'under_observation'

                    return (
                      <tr key={solicitud.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="p-4">
                          <span className="font-mono text-sm">{solicitud.radicado}</span>
                        </td>
                        <td className="p-4">
                          <p className="max-w-60 truncate font-medium">{solicitud.titulo}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{solicitud.subidoPor}</p>
                        </td>
                        <td className="hidden p-4 lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <span className="text-sm">{solicitud.departamento?.nombre ?? 'Sin asignar'}</span>
                          </div>
                        </td>
                        <td className="p-4"><FechaLimiteBadge fechaLimite={solicitud.fechaLimite} /></td>
                        <td className="p-4"><EstadoBadge estado={solicitud.estado} /></td>
                        <td className="hidden p-4 md:table-cell">
                          <span className="text-sm">{solicitud.subidoPor}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center justify-end gap-2">

                            {/* Ver detalle */}
                            <button type="button"
                              onClick={() => handleViewDetail(solicitud)}
                              className="icon-button hover:bg-secondary"
                              aria-label={`Ver detalle de ${solicitud.radicado}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>

                            {/* Aprobar → awaiting_mayor_signature */}
                            <button type="button"
                              onClick={() => handleAlcaldeAction(solicitud, 'awaiting_mayor_signature')}
                              disabled={!canApprove}
                              aria-label={`Aprobar ${solicitud.radicado}`}
                              className="inline-flex items-center gap-2 rounded-md bg-success px-3 py-2 text-sm font-medium text-success-foreground transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <CheckCircle className="h-4 w-4" aria-hidden="true" />
                              <span className="hidden xl:inline">Aprobar</span>
                            </button>

                            {/* Solicitar Cambios → under_observation */}
                            <button type="button"
                              onClick={() => handleAlcaldeAction(solicitud, 'under_observation')}
                              disabled={!canRequestChanges && !isUnderObservation}
                              aria-label={`Solicitar cambios en ${solicitud.radicado}`}
                              className="inline-flex items-center gap-2 rounded-md bg-warning/10 border border-warning/30 px-3 py-2 text-sm font-medium text-warning transition hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
                              <span className="hidden xl:inline">
                                {isUnderObservation ? 'En seguimiento' : 'Solicitar cambios'}
                              </span>
                            </button>

                            {/* Firmar → signed */}
                            <button type="button"
                              onClick={() => handleAlcaldeAction(solicitud, 'signed')}
                              disabled={!canSign}
                              aria-label={isSigned ? `${solicitud.radicado} ya fue firmada` : `Firmar ${solicitud.radicado}`}
                              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                                isSigned
                                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                                  : canSign
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'cursor-not-allowed bg-muted text-muted-foreground opacity-40'
                              }`}
                            >
                              <PenLine className="h-4 w-4" aria-hidden="true" />
                              <span className="hidden xl:inline">{isSigned ? 'Firmada' : 'Firmar'}</span>
                            </button>

                            {/* Rechazar definitivamente → rejected_by_mayor_office */}
                            <button type="button"
                              onClick={() => handleAlcaldeAction(solicitud, 'rejected_by_mayor_office')}
                              disabled={!canRejectFinal}
                              aria-label={`Rechazar definitivamente ${solicitud.radicado}`}
                              className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <XCircle className="h-4 w-4" aria-hidden="true" />
                              <span className="hidden xl:inline">Rechazar</span>
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
                <button type="button"
                  onClick={() => updateFilter('page', String(safeCurrentPage - 1))}
                  disabled={safeCurrentPage === 1}
                  className="icon-button border border-border disabled:opacity-50"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="text-sm">Página {safeCurrentPage} de {totalPages}</span>
                <button type="button"
                  onClick={() => updateFilter('page', String(safeCurrentPage + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="icon-button border border-border disabled:opacity-50"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
            onOpenChange={open => {
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