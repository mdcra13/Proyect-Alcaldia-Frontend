import { useMemo, useState } from 'react'
import {
  ArrowRightLeft,
  Download,
  Eye,
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
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { Solicitud, SolicitudEstadoFiltro } from '@/lib/types'
interface StatusFilter {
  value: SolicitudEstadoFiltro
  label: string
}

const statusFilters: StatusFilter[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'declinado', label: 'Declinados' },
]

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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SolicitudEstadoFiltro>('todos')
  const [viewSolicitud, setViewSolicitud] = useState<Solicitud | null>(null)
  const [changeDeptSolicitud, setChangeDeptSolicitud] = useState<Solicitud | null>(null)
  const [historialSolicitud, setHistorialSolicitud] = useState<Solicitud | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const { search, CATEGORIES } = useSolicitudesStore()
  const departamentos = useDepartamentosStore(state => state.departamentos)

  const filteredSolicitudes = useMemo(() => {
    return search(searchQuery, { estado: statusFilter })
  }, [search, searchQuery, statusFilter])

  const totalPages = Math.ceil(filteredSolicitudes.length / ITEMS_PER_PAGE)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const getDepartamentoNombre = (departamentoId?: string) => {
    if (!departamentoId) return 'Sin asignar'

    const departamento = departamentos.find(item => item.id === departamentoId)

    return departamento?.nombre ?? 'Sin asignar'
  }

  const handleStatusFilterChange = (value: SolicitudEstadoFiltro) => {
  setStatusFilter(value)
  setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleExport = () => {
    const headers = [
      'Radicado',
      'Solicitante',
      'Categoría',
      'Departamento',
      'Fecha solicitud',
      'Fecha límite',
      'Estado',
    ]

    const rows = filteredSolicitudes.map(solicitud => [
      solicitud.radicado,
      solicitud.solicitante,
      CATEGORIES[solicitud.categoria]?.label ?? solicitud.categoria,
      getDepartamentoNombre(solicitud.departamentoId),
      solicitud.fechaSolicitud,
      solicitud.fechaLimite,
      solicitud.estado,
    ])

    exportRowsToCSV(
      `solicitudes_${new Date().toISOString().split('T')[0]}.csv`,
      [headers, ...rows],
    )
  }

  return (
    <AppLayout title="Seguimiento de Solicitudes">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
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

      <div className="mb-4 flex flex-wrap gap-2">
        {statusFilters.map(filter => (
          <button
            key={filter.value}
            type="button"
            onClick={() => handleStatusFilterChange(filter.value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-secondary'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <label htmlFor="seguimiento-search" className="sr-only">
          Buscar solicitudes
        </label>
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="seguimiento-search"
          type="text"
          placeholder="Buscar por nombre de solicitante o número de radicado..."
          value={searchQuery}
          onChange={event => handleSearchChange(event.target.value)}
          className="search-input"
        />
      </div>

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

                    <td className="table-td">{solicitud.solicitante}</td>

                    <td className="table-td">
                      <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                        {getDepartamentoNombre(solicitud.departamentoId)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                    {getDepartamentoNombre(solicitud.departamentoId)}
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
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="px-4 py-2 text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
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
    </AppLayout>
  )
}