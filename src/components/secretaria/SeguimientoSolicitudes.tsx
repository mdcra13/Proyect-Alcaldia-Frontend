import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import EmptyState from '@/components/ui/empty-state'
import Pagination from '@/components/shared/Pagination'
import usePagination from '@/lib/hooks/usePagination'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import { ESTADO_CONFIG } from '@/lib/types'
import type { Solicitud, SolicitudEstado } from '@/lib/types'
import { exportToCSV } from '@/lib/utils'

type TabFilter = 'todos' | SolicitudEstado

const TABS: { value: TabFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'received', label: 'Recibidas' },
  { value: 'assigned_to_department', label: 'Asignadas' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'approved_by_department', label: 'Aprobadas por depto.' },
  { value: 'awaiting_mayor_signature', label: 'Pendientes de firma' },
  { value: 'signed', label: 'Firmadas' },
  { value: 'closed', label: 'Cerradas' },
  { value: 'rejected_by_department', label: 'Rechazadas por depto.' },
  { value: 'rejected_by_mayor_office', label: 'Rechazadas por Alcaldía' },
]

const ITEMS_PER_PAGE = 8

export default function SeguimientoSolicitudes() {
  const solicitudes = useSolicitudesStore(state => state.solicitudes)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewSolicitud, setPreviewSolicitud] = useState<Solicitud | null>(null)

  const filtered = useMemo(() => {
    let results = solicitudes

    if (activeTab !== 'todos') {
      results = results.filter(solicitud => solicitud.estado === activeTab)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()

      results = results.filter(
        solicitud =>
          solicitud.radicado.toLowerCase().includes(query) ||
          solicitud.solicitante.toLowerCase().includes(query) ||
          solicitud.identificacion.toLowerCase().includes(query) ||
          solicitud.titulo.toLowerCase().includes(query),
      )
    }

    return results
  }, [solicitudes, activeTab, searchQuery])

  const { paginatedItems, totalItems } = usePagination({
    items: filtered,
    itemsPerPage: ITEMS_PER_PAGE,
    currentPage,
    onPageChange: setCurrentPage,
  })

  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleExport = () => {
    exportToCSV(filtered, `seguimiento-${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <AppLayout title="Seguimiento de Solicitudes">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Seguimiento de Solicitudes
          </h2>
          <p className="text-muted-foreground">
            {filtered.length} solicitud{filtered.length !== 1 ? 'es' : ''} encontrada
            {filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por radicado, nombre o título..."
              value={searchQuery}
              onChange={event => handleSearch(event.target.value)}
              className="search-input sm:w-72"
            />
          </div>

          <button type="button" onClick={handleExport} className="btn-export">
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="seguimiento-tabs">
        {TABS.map(tab => {
          const count =
            tab.value === 'todos'
              ? solicitudes.length
              : solicitudes.filter(solicitud => solicitud.estado === tab.value).length

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={`seguimiento-tab ${activeTab === tab.value ? 'seguimiento-tab-active' : ''}`}
            >
              {tab.label}
              <span
                className={`seguimiento-tab-count ${
                  activeTab === tab.value ? 'seguimiento-tab-count-active' : ''
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {paginatedItems.length === 0 ? (
        <EmptyState
          title="No hay solicitudes"
          description="No se encontraron solicitudes con los filtros actuales."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    '# Radicado',
                    'Solicitante',
                    'Categoría',
                    'Fecha límite',
                    'Subido por',
                    'Estado',
                    'Acciones',
                  ].map((heading, index) => (
                    <th
                      key={heading}
                      className={`table-th ${index === 6 ? 'text-right' : 'text-left'}`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedItems.map(solicitud => {
                  const status = ESTADO_CONFIG[solicitud.estado]
                  const category = CATEGORIES[solicitud.categoria]

                  return (
                    <tr
                      key={solicitud.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="table-td font-mono font-medium text-primary">
                        {solicitud.radicado}
                      </td>

                      <td className="table-td">
                        <p className="font-medium text-foreground">
                          {solicitud.solicitante}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {solicitud.identificacion}
                        </p>
                      </td>

                      <td className="table-td">
                        <span className={`category-badge ${category.color}`}>
                          {category.icon} {category.label}
                        </span>
                      </td>

                      <td className="table-td text-muted-foreground">
                        {solicitud.fechaLimite}
                      </td>

                      <td className="table-td text-foreground">{solicitud.subidoPor}</td>

                      <td className="table-td">
                        <span className={`status-badge ${status.color}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="table-td text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewSolicitud(solicitud)}
                          className="btn-ver-detalle"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {paginatedItems.map(solicitud => {
              const status = ESTADO_CONFIG[solicitud.estado]
              const category = CATEGORIES[solicitud.categoria]

              return (
                <div
                  key={solicitud.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className={`category-badge ${category.color}`}>
                      {category.icon} {category.label}
                    </span>
                    <span className={`status-badge ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="mb-1 font-mono text-sm font-medium text-primary">
                    {solicitud.radicado}
                  </p>
                  <p className="font-medium text-foreground">{solicitud.solicitante}</p>
                  <p className="text-sm text-muted-foreground">
                    {solicitud.identificacion}
                  </p>
                  <p className="mb-4 mt-1 text-sm text-muted-foreground">
                    Límite {solicitud.fechaLimite} · Subido por {solicitud.subidoPor}
                  </p>

                  <button
                    type="button"
                    onClick={() => setPreviewSolicitud(solicitud)}
                    className="mobile-card-btn w-full bg-secondary text-secondary-foreground"
                  >
                    Ver detalle
                  </button>
                </div>
              )
            })}
          </div>

          <Pagination
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {previewSolicitud && (
        <DocumentPreviewModal
          open={Boolean(previewSolicitud)}
          solicitud={previewSolicitud}
          onClose={() => setPreviewSolicitud(null)}
        />
      )}
    </AppLayout>
  )
}