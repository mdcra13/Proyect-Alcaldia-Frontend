import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import EmptyState from '@/components/ui/empty-state'
import Pagination from '@/components/shared/Pagination'
import usePagination from '@/lib/hooks/usePagination'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import type { Solicitud, SolicitudEstado } from '@/lib/types'
import { exportToCSV } from '@/lib/utils'

type TabFilter = 'todos' | SolicitudEstado

const TABS: { value: TabFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_revision', label: 'En Revisión' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'declinado', label: 'Declinados' },
]

const STATUS_LABELS: Record<SolicitudEstado, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'status-pendiente' },
  en_revision: { label: 'En Revisión', className: 'status-en-revision' },
  aprobado: { label: 'Aprobado', className: 'status-aprobado' },
  declinado: { label: 'Declinado', className: 'status-declinado' },
}

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
      results = results.filter(s => s.estado === activeTab)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        s =>
          s.radicado.toLowerCase().includes(q) ||
          s.solicitante.toLowerCase().includes(q),
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Seguimiento de Solicitudes
          </h2>
          <p className="text-muted-foreground">
            {filtered.length} solicitud{filtered.length !== 1 ? 'es' : ''} encontrada
            {filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por radicado o nombre..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="search-input sm:w-72"
            />
          </div>

          <button type="button" onClick={handleExport} className="btn-export">
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Estado tabs */}
      <div className="seguimiento-tabs">
        {TABS.map(tab => {
          const count =
            tab.value === 'todos'
              ? solicitudes.length
              : solicitudes.filter(s => s.estado === tab.value).length

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={`seguimiento-tab ${activeTab === tab.value ? 'seguimiento-tab-active' : ''}`}
            >
              {tab.label}
              <span
                className={`seguimiento-tab-count ${activeTab === tab.value ? 'seguimiento-tab-count-active' : ''}`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tabla desktop / tarjetas mobile */}
      {paginatedItems.length === 0 ? (
        <EmptyState
          title="No hay solicitudes"
          description="No se encontraron solicitudes con los filtros actuales."
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['# Radicado', 'Solicitante', 'Categoría', 'Fecha', 'Subido por', 'Estado', 'Acciones'].map(
                    (heading, index) => (
                      <th
                        key={heading}
                        className={`table-th ${index === 6 ? 'text-right' : 'text-left'}`}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {paginatedItems.map(solicitud => {
                  const status = STATUS_LABELS[solicitud.estado]
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
                        <p className="font-medium text-foreground">{solicitud.solicitante}</p>
                        <p className="text-sm text-muted-foreground">{solicitud.identificacion}</p>
                      </td>

                      <td className="table-td">
                        <span className={`category-badge ${category.color}`}>
                          {category.icon} {category.label}
                        </span>
                      </td>

                      <td className="table-td text-muted-foreground">{solicitud.fechaIngreso}</td>

                      <td className="table-td text-foreground">{solicitud.subidoPor}</td>

                      <td className="table-td">
                        <span className={`status-badge ${status.className}`}>
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

          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            {paginatedItems.map(solicitud => {
              const status = STATUS_LABELS[solicitud.estado]
              const category = CATEGORIES[solicitud.categoria]

              return (
                <div
                  key={solicitud.id}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`category-badge ${category.color}`}>
                      {category.icon} {category.label}
                    </span>
                    <span className={`status-badge ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="font-mono font-medium text-primary text-sm mb-1">
                    {solicitud.radicado}
                  </p>
                  <p className="font-medium text-foreground">{solicitud.solicitante}</p>
                  <p className="text-sm text-muted-foreground">{solicitud.identificacion}</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    {solicitud.fechaIngreso} · Subido por {solicitud.subidoPor}
                  </p>

                  <button
                    type="button"
                    onClick={() => setPreviewSolicitud(solicitud)}
                    className="mobile-card-btn bg-secondary text-secondary-foreground w-full"
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
