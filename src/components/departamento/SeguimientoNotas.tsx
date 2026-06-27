import { useCallback, useMemo, useState } from 'react'
import { Download, Eye, History, X } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import AccessibleDialog from '@/components/shared/AccessibleDialog'
import { HistorialTimeline } from '@/components/shared/HistorialTimeline'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import SolicitudFiltersPanel from '@/components/shared/SolicitudFiltersPanel'
import SolicitudesTableHeader from '@/components/shared/SolicitudesTableHeader'
import SolicitudTableRow from '@/components/shared/SolicitudTableRow'
import TablePagination from '@/components/shared/TablePagination'
import { useSolicitudFilters } from '@/lib/hooks/useSolicitudFilters'
import { useFilteredSolicitudes } from '@/lib/hooks/useFilteredSolicitudes'
import { usePaginatedList } from '@/lib/hooks/usePaginatedList'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import { backendApi, mapBackendHistory } from '@/lib/api/backend'
import { ESTADO_CONFIG, type HistorialEntry, type Solicitud } from '@/lib/types'

const ITEMS_PER_PAGE = 10

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function escapeCSVCell(value: string | number | null | undefined) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function exportSolicitudesCSV(solicitudes: Solicitud[]) {
  const headers = ['Radicado', 'Título', 'Solicitante', 'Fecha límite', 'Fecha ingreso', 'Estado']

  const rows = solicitudes.map(solicitud => [
    solicitud.radicado,
    solicitud.titulo,
    solicitud.solicitante,
    solicitud.fechaLimite,
    solicitud.fechaSolicitud,
    ESTADO_CONFIG[solicitud.estado]?.label ?? solicitud.estado,
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(escapeCSVCell).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', 'seguimiento-notas-departamento.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function SeguimientoNotas() {
  const user = useAuthStore(state => state.user)
  const solicitudes = useSolicitudesStore(state => state.solicitudes)

  const {
    searchQuery,
    estado,
    categoria,
    prioridad,
    fechaDesde,
    fechaHasta,
    currentPage,
    updateFilter,
    clearFilters,
    activeFiltersCount,
    hasActiveFilters,
  } = useSolicitudFilters()

  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historialEntries, setHistorialEntries] = useState<HistorialEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  const departamentoNombre = user?.departamento?.nombre ?? 'Mi Departamento'

  // Base: todas las notas del departamento, en cualquier estado
  const notasDepartamento = useMemo(() => {
    if (!user?.departamentoId) return []

    return solicitudes.filter(
      solicitud => solicitud.departamentoId === user.departamentoId
    )
  }, [solicitudes, user?.departamentoId])

  const filteredSolicitudes = useFilteredSolicitudes(
  notasDepartamento,
  { searchQuery, estado, categoria, prioridad, fechaDesde, fechaHasta },
  'fechaSolicitud-desc'
)

  const { totalPages, safeCurrentPage, paginatedItems: paginatedSolicitudes } =
    usePaginatedList(filteredSolicitudes, currentPage, ITEMS_PER_PAGE)

  const goToPage = (page: number) => updateFilter('page', String(page))

  const handleOpenDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowDetailModal(true)
  }

  const handleOpenHistory = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setHistorialEntries(solicitud.historial)
    setShowHistoryModal(true)
    setIsHistoryLoading(true)

    void backendApi.requestHistory(solicitud.id)
      .then(entries => {
        const mappedEntries = mapBackendHistory(entries)
        setHistorialEntries(mappedEntries.length > 0 ? mappedEntries : solicitud.historial)
      })
      .catch(() => {
        setHistorialEntries(solicitud.historial)
      })
      .finally(() => {
        setIsHistoryLoading(false)
      })
  }

  const handleCloseModals = useCallback(() => {
    setSelectedSolicitud(null)
    setShowDetailModal(false)
    setShowHistoryModal(false)
    setHistorialEntries([])
    setIsHistoryLoading(false)
  }, [])

  const handleExportCSV = () => {
    exportSolicitudesCSV(filteredSolicitudes)
  }

  return (
    <AppLayout title="Seguimiento de Notas">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary">
              Seguimiento de Notas
            </h1>
            <p className="text-muted-foreground">
              Historial completo de solicitudes gestionadas por el departamento de{' '}
              {departamentoNombre}.
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {filteredSolicitudes.length} notas encontradas
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden="true" focusable="false" />
            Exportar CSV
          </button>
        </div>

        <SolicitudFiltersPanel
          headingLevel={2}
          idPrefix="seguimiento-notas"
          departamentos={[]}
          searchQuery={searchQuery}
          estado={estado}
          departamento="todos"
          categoria={categoria}
          prioridad={prioridad}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          activeFiltersCount={activeFiltersCount}
          hasActiveFilters={hasActiveFilters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
        />

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-semibold text-foreground">
              Historial de gestión
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <SolicitudesTableHeader showFechaIngreso />

              <tbody>
                {paginatedSolicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No hay notas para mostrar con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedSolicitudes.map(solicitud => (
                    <SolicitudTableRow
                      key={solicitud.id}
                      solicitud={solicitud}
                      fechaIngresoFormatted={formatDate(solicitud.fechaSolicitud)}
                      actions={
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(solicitud)}
                            className="icon-button hover:bg-secondary"
                            title="Ver detalle"
                            aria-label={`Ver detalle de ${solicitud.radicado}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" focusable="false" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenHistory(solicitud)}
                            className="icon-button hover:bg-secondary"
                            title="Ver historial"
                            aria-label={`Ver historial de ${solicitud.radicado}`}
                          >
                            <History className="h-4 w-4" aria-hidden="true" focusable="false" />
                          </button>
                        </>
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredSolicitudes.length > ITEMS_PER_PAGE && (
            <TablePagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filteredSolicitudes.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={goToPage}
            />
          )}
        </section>

        {/* Detalle : usa DocumentPreviewModal existente, sin acciones de aprobar/rechazar */}
        {showDetailModal && selectedSolicitud && (
          <DocumentPreviewModal
            solicitud={selectedSolicitud}
            open={showDetailModal}
            onClose={handleCloseModals}
          />
        )}

        {showHistoryModal && selectedSolicitud && (
          <AccessibleDialog
            titleId="history-solicitud-title"
            descriptionId="history-solicitud-description"
            onClose={handleCloseModals}
            className="modal-card max-h-[90vh] max-w-2xl overflow-y-auto"
          >
              <div className="modal-header">
                <div>
                  <h2 id="history-solicitud-title" className="font-serif text-xl font-semibold text-foreground">
                    Historial de {selectedSolicitud.radicado}
                  </h2>
                  <p id="history-solicitud-description" className="text-sm text-muted-foreground">
                    {selectedSolicitud.titulo}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="icon-button hover:bg-secondary"
                  aria-label="Cerrar historial"
                >
                  <X className="h-5 w-5" aria-hidden="true" focusable="false" />
                </button>
              </div>

              <div className="p-6">
                {isHistoryLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Cargando historial...
                  </p>
                ) : (
                  <HistorialTimeline historial={historialEntries} />
                )}
              </div>
          </AccessibleDialog>
        )}

      </div>
    </AppLayout>
  )
}

