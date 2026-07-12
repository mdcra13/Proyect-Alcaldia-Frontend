import { useMemo, useRef, useState } from 'react'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  X,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import SolicitudFiltersPanel from '@/components/shared/SolicitudFiltersPanel'
import { CambiarDepartamentoModal } from '@/components/shared/CambiarDepartamentoModal'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { FechaLimiteBadge } from '@/components/shared/FechaLimiteBadge'
import { HistorialTimeline } from '@/components/shared/HistorialTimeline'
import { useSolicitudFilters } from '@/lib/hooks/useSolicitudFilters'
import useAuthStore from '@/lib/stores/authStore'
import { filterSolicitudes } from '@/lib/utils'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import { useModalAccessibility } from '@/lib/hooks/useModalAccessibility'
import {
  ESTADO_CONFIG,
  PRIORIDAD_LABELS,
  type Solicitud,
  type SolicitudEstado,
} from '@/lib/types'

const ITEMS_PER_PAGE = 10

const ESTADOS_FINALES: SolicitudEstado[] = [
  'rejected_by_department',
  'rejected_by_mayor_office',
  'signed',
  'closed',
]

function downloadCSV(filename: string, rows: string[][]) {
  const escapeCell = (cell: string) => {
    const value = cell.replaceAll('"', '""')
    return `"${value}"`
  }

  const csv = rows.map(row => row.map(escapeCell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export default function SecretariaNotas() {
  const filters = useSolicitudFilters()
  const { user } = useAuthStore()
  const solicitudes = useSolicitudesStore(state => state.solicitudes)
  const getDepartamentosActivos = useDepartamentosStore(
    state => state.getDepartamentosActivos
  )

  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showChangeDeptModal, setShowChangeDeptModal] = useState(false)
  const detailDialogRef = useRef<HTMLDivElement>(null)

  const departamentos = getDepartamentosActivos()

  const getDepartamentoNombre = (departamentoId?: string) => {
    if (!departamentoId) return 'Sin asignar'

    const departamento = departamentos.find(item => item.id === departamentoId)

    return departamento?.nombre ?? 'Sin asignar'
  }

  const filteredSolicitudes = useMemo(() => {
  if (!user) return []

  return filterSolicitudes(
    solicitudes,
    {
      searchQuery: filters.searchQuery,
      identificadorQuery: filters.identificadorQuery,
      estado: filters.estado,
      departamento: filters.departamento,
      categoria: filters.categoria,
      prioridad: filters.prioridad,
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
    },
    {
      subidoPorId: user.id,
    }
  )
}, [
  user,
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

  const handleExportCSV = () => {
    const headers = [
      'Identificador',
      'Identificador',
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
      solicitud.titulo,
      solicitud.solicitante,
      solicitud.identificacion,
      CATEGORIES[solicitud.categoria]?.label ?? solicitud.categoria,
      solicitud.departamento?.nombre ?? getDepartamentoNombre(solicitud.departamentoId),
      PRIORIDAD_LABELS[solicitud.prioridad] ?? solicitud.prioridad,
      solicitud.fechaSolicitud,
      solicitud.fechaLimite,
      ESTADO_CONFIG[solicitud.estado]?.label ?? solicitud.estado,
    ])

    downloadCSV(
      `notas_${new Date().toISOString().split('T')[0]}.csv`,
      [headers, ...rows]
    )
  }

  const handleViewDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowDetailModal(true)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedSolicitud(null)
  }

  useModalAccessibility(showDetailModal && Boolean(selectedSolicitud), detailDialogRef, handleCloseDetail)

  const handleChangeDepartment = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowChangeDeptModal(true)
  }

  return (
    <AppLayout title="Mis Notas">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary">
              Mis Notas
            </h1>
            <p className="text-muted-foreground">
              {filteredSolicitudes.length} notas encontradas
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        <SolicitudFiltersPanel
          idPrefix="secretaria-notas"
          headingLevel={2}
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

        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Identificador
                  </th>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Identificador
                  </th>
                  <th className="hidden p-4 text-left font-medium text-muted-foreground md:table-cell">
                    Departamento
                  </th>
                  <th className="hidden p-4 text-left font-medium text-muted-foreground lg:table-cell">
                    Prioridad
                  </th>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Fecha límite
                  </th>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="p-4 text-right font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedSolicitudes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No se encontraron notas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedSolicitudes.map(solicitud => (
                    <tr
                      key={solicitud.id}
                      className="border-b transition-colors hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm">
                          {solicitud.radicado}
                        </span>
                      </td>

                      <td className="p-4">
                        <div>
                          <p className="max-w-[220px] truncate font-medium">
                            {solicitud.titulo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {solicitud.solicitante}
                          </p>
                        </div>
                      </td>

                      <td className="hidden p-4 md:table-cell">
                        <span className="text-sm">
                          {solicitud.departamento?.nombre ??
                            getDepartamentoNombre(solicitud.departamentoId)}
                        </span>
                      </td>

                      <td className="hidden p-4 lg:table-cell">
                        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                          {PRIORIDAD_LABELS[solicitud.prioridad]}
                        </span>
                      </td>

                      <td className="p-4">
                        <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
                      </td>

                      <td className="p-4">
                        <EstadoBadge estado={solicitud.estado} />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(solicitud)}
                            className="icon-button hover:bg-secondary"
                            title="Ver detalle"
                            aria-label={`Ver detalle de ${solicitud.radicado}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {solicitud.estado === 'received' ? (
                            <button
                              type="button"
                              onClick={() => handleChangeDepartment(solicitud)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-secondary"
                              title="Asignar departamento"
                            >
                              <Building2 className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                Asignar depto.
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleChangeDepartment(solicitud)}
                              disabled={ESTADOS_FINALES.includes(solicitud.estado)}
                              className="icon-button hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                              title="Cambiar departamento"
                              aria-label={`Cambiar departamento de ${solicitud.radicado}`}
                            >
                              <Building2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredSolicitudes.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                {Math.min(
                  safeCurrentPage * ITEMS_PER_PAGE,
                  filteredSolicitudes.length
                )}{' '}
                de {filteredSolicitudes.length} notas
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => filters.updateFilter('page', String(safeCurrentPage - 1))}
                  disabled={safeCurrentPage === 1}
                  aria-label="Página anterior"
                  className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm">
                  Página {safeCurrentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => filters.updateFilter('page', String(safeCurrentPage + 1))}
                  disabled={safeCurrentPage === totalPages}
                  aria-label="Página siguiente"
                  className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {showDetailModal && selectedSolicitud && (
          <div
            ref={detailDialogRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="secretaria-nota-detalle-title"
          >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2
                  id="secretaria-nota-detalle-title"
                  className="font-serif text-xl font-semibold text-foreground"
                >
                  Detalle de Nota {selectedSolicitud.radicado}
                </h2>

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="icon-button hover:bg-secondary"
                  aria-label="Cerrar detalle"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Identificador</p>
                    <p className="font-medium">{selectedSolicitud.titulo}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <EstadoBadge estado={selectedSolicitud.estado} />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Solicitante</p>
                    <p className="font-medium">{selectedSolicitud.solicitante}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Identificación
                    </p>
                    <p className="font-medium">
                      {selectedSolicitud.identificacion}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <p className="font-medium">
                      {CATEGORIES[selectedSolicitud.categoria]?.label ??
                        selectedSolicitud.categoria}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Prioridad</p>
                    <p className="font-medium">
                      {PRIORIDAD_LABELS[selectedSolicitud.prioridad]}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Departamento</p>
                    <p className="font-medium">
                      {selectedSolicitud.departamento?.nombre ??
                        getDepartamentoNombre(selectedSolicitud.departamentoId)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Fecha límite</p>
                    <FechaLimiteBadge fechaLimite={selectedSolicitud.fechaLimite} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Descripción</p>
                  <p className="rounded-lg bg-muted p-3 text-sm">
                    {selectedSolicitud.descripcion}
                  </p>
                </div>

                {selectedSolicitud.motivoRechazo && (
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Motivo de rechazo
                    </p>
                    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {selectedSolicitud.motivoRechazo}
                    </p>
                  </div>
                )}

                <div>
                  <p className="mb-3 text-sm text-muted-foreground">Historial</p>
                  <HistorialTimeline historial={selectedSolicitud.historial} />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSolicitud && (
          <CambiarDepartamentoModal
            solicitud={selectedSolicitud}
            open={showChangeDeptModal}
            onOpenChange={setShowChangeDeptModal}
            isFirstAssignment={selectedSolicitud.estado === 'received'}
          />
        )}
      </div>
    </AppLayout>
  )
}
