import { useMemo, useRef, useState } from 'react'
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  History,
  X,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import SolicitudFiltersPanel from '@/components/shared/SolicitudFiltersPanel'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import CambiarDepartamentoModal from '@/components/shared/CambiarDepartamentoModal'
import EstadoBadge from '@/components/shared/EstadoBadge'
import FechaLimiteBadge from '@/components/shared/FechaLimiteBadge'
import HistorialTimeline from '@/components/shared/HistorialTimeline'
import { useSolicitudFilters } from '@/lib/hooks/useSolicitudFilters'
import { filterSolicitudes, decodeText, normalizeDepartamentoNombre } from '@/lib/utils'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import { useModalAccessibility } from '@/lib/hooks/useModalAccessibility'
import { backendApi, mapBackendHistory } from '@/lib/api/backend'
import {
  ESTADO_CONFIG,
  PRIORIDAD_LABELS,
  type HistorialEntry,
  type Solicitud,
} from '@/lib/types'

const ITEMS_PER_PAGE = 10

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
  const filters = useSolicitudFilters()

  const [viewSolicitud, setViewSolicitud] = useState<Solicitud | null>(null)
  const [changeDeptSolicitud, setChangeDeptSolicitud] = useState<Solicitud | null>(null)
  const [historialSolicitud, setHistorialSolicitud] = useState<Solicitud | null>(null)
  const [historialEntries, setHistorialEntries] = useState<HistorialEntry[]>([])
  const [isHistorialLoading, setIsHistorialLoading] = useState(false)
  const historialDialogRef = useRef<HTMLDivElement>(null)

  const solicitudes = useSolicitudesStore(state => state.solicitudes)
  const departamentos = useDepartamentosStore(state => state.departamentos)

  const closeHistorial = () => {
    setHistorialSolicitud(null)
    setHistorialEntries([])
    setIsHistorialLoading(false)
  }

  const openHistorial = (solicitud: Solicitud) => {
    setHistorialSolicitud(solicitud)
    setHistorialEntries(solicitud.historial)
    setIsHistorialLoading(true)

    void backendApi.requestHistory(solicitud.id)
      .then(entries => {
        const mappedEntries = mapBackendHistory(entries)
        setHistorialEntries(mappedEntries.length > 0 ? mappedEntries : solicitud.historial)
      })
      .catch(() => {
        setHistorialEntries(solicitud.historial)
      })
      .finally(() => {
        setIsHistorialLoading(false)
      })
  }

  useModalAccessibility(Boolean(historialSolicitud), historialDialogRef, closeHistorial)

  const getDepartamentoNombre = (departamentoId?: string) => {
    if (!departamentoId) return 'Sin asignar'

    const departamento = departamentos.find(item => item.id === departamentoId)

    return departamento?.nombre ?? 'Sin asignar'
  }

  const filteredSolicitudes = useMemo(() => {
  return filterSolicitudes(solicitudes, {
    searchQuery: filters.searchQuery,
    identificadorQuery: filters.identificadorQuery,
    estado: filters.estado,
    departamento: filters.departamento,
    categoria: filters.categoria,
    prioridad: filters.prioridad,
    fechaDesde: filters.fechaDesde,
    fechaHasta: filters.fechaHasta,
  })
}, [
  solicitudes,
  filters.searchQuery,
  filters.identificadorQuery,
  filters.estado,
  filters.departamento,
  filters.categoria,
  filters.prioridad,
  filters.fechaDesde,
  filters.fechaHasta,
])

  const totalPages = Math.max(1, Math.ceil(filteredSolicitudes.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(Math.max(filters.currentPage, 1), totalPages)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  )

  const handleExport = () => {
    const headers = [
      'Código de seguimiento',
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
      decodeText(solicitud.solicitante),
      decodeText(solicitud.identificacion),
      CATEGORIES[solicitud.categoria]?.label ?? decodeText(solicitud.categoria),
      normalizeDepartamentoNombre(solicitud.departamento?.nombre) ?? normalizeDepartamentoNombre(getDepartamentoNombre(solicitud.departamentoId)),
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

        <SolicitudFiltersPanel
          idPrefix="seguimiento-solicitudes"
          departamentos={departamentos}
          searchQuery={filters.searchQuery}
          identificadorQuery={filters.identificadorQuery}
          estado={filters.estado}
          departamento={filters.departamento}
          categoria={filters.categoria}
          prioridad={filters.prioridad}
          fechaDesde={filters.fechaDesde}
          fechaHasta={filters.fechaHasta}
          activeFiltersCount={filters.activeFiltersCount}
          hasActiveFilters={filters.hasActiveFilters}
          updateFilter={filters.updateFilter}
          clearFilters={filters.clearFilters}
        />

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
                    <th className="table-th text-left"># Código de seguimiento</th>
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
                        <p className="font-medium">{decodeText(solicitud.solicitante)}</p>
                        <p className="text-xs text-muted-foreground">
                          {decodeText(solicitud.identificacion)}
                        </p>
                      </td>

                      <td className="table-td">
                        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground whitespace-nowrap">
                          {normalizeDepartamentoNombre(solicitud.departamento?.nombre) ??
                            normalizeDepartamentoNombre(getDepartamentoNombre(solicitud.departamentoId))}
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
                            onClick={() => openHistorial(solicitud)}
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
                      onClick={() =>
                        filters.updateFilter('page', String(safeCurrentPage - 1))
                      }
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
                      onClick={() =>
                        filters.updateFilter('page', String(safeCurrentPage + 1))
                      }
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
                    {decodeText(solicitud.solicitante)}
                  </p>

                  <p className="mb-3 text-sm text-muted-foreground">
                    {decodeText(solicitud.identificacion)}
                  </p>

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground whitespace-nowrap">
                      {normalizeDepartamentoNombre(solicitud.departamento?.nombre) ??
                        normalizeDepartamentoNombre(getDepartamentoNombre(solicitud.departamentoId))}
                    </span>

                    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground whitespace-nowrap">
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
                      onClick={() => openHistorial(solicitud)}
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
                    onClick={() =>
                      filters.updateFilter('page', String(safeCurrentPage - 1))
                    }
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
                    onClick={() =>
                      filters.updateFilter('page', String(safeCurrentPage + 1))
                    }
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
          <div
            ref={historialDialogRef}
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="seguimiento-historial-title"
          >
            <div className="modal-card max-h-[80vh] max-w-lg overflow-y-auto">
              <div className="modal-header">
                <div>
                  <h3
                    id="seguimiento-historial-title"
                    className="font-serif text-xl font-semibold text-foreground"
                  >
                    Historial de Cambios
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Solicitud {historialSolicitud.radicado}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeHistorial}
                  className="icon-button hover:bg-secondary"
                  aria-label="Cerrar historial"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                {isHistorialLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Cargando historial...
                  </p>
                ) : (
                  <HistorialTimeline historial={historialEntries} />
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeHistorial}
                  className="modal-btn-cancel"
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
