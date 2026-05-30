import { useState, useMemo } from 'react'
import { Search, Filter, ChevronDown, Eye, Check, X, Calendar, SortAsc, FileText, Heart, GraduationCap, Users, Building, type LucideIcon } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import EmptyState from '@/components/ui/empty-state'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import useNotificationStore from '@/lib/stores/notificationStore'
import type { Solicitud, SolicitudCategoria, SolicitudEstado } from '@/lib/types'

const categoryIcons: Record<SolicitudCategoria, LucideIcon> = {
  salud: Heart,
  educacion: GraduationCap,
  familiar: Users,
  comunidad: Building,
}

interface StatusConfig {
  label: string
  color: string
}

const statusLabels: Record<SolicitudEstado, StatusConfig> = {
  pendiente:   { label: 'Pendiente',   color: 'status-pendiente' },
  en_revision: { label: 'En revisión', color: 'status-en-revision' },
  aprobado:    { label: 'Aprobado',    color: 'status-aprobado' },
  declinado:   { label: 'Declinado',   color: 'status-declinado' },
}

/* ─── StatusBadge ─────────────────────────────────────────── */
interface StatusBadgeProps { status: SolicitudEstado }

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusLabels[status] ?? statusLabels.pendiente
  return (
    <span className={`status-badge ${config.color}`}>
      {config.label}
    </span>
  )
}

/* ─── CategoryBadge ───────────────────────────────────────── */
interface CategoryBadgeProps { category: SolicitudCategoria }

function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORIES[category]
  const Icon = categoryIcons[category] ?? FileText
  return (
    <div className={`category-badge ${config?.color ?? 'bg-muted text-muted-foreground'}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config?.label ?? category}</span>
    </div>
  )
}

/* ─── DocumentPreviewModal ────────────────────────────────── */
interface DocumentPreviewModalProps {
  solicitud: Solicitud | null
  onClose: () => void
}

function DocumentPreviewModal({ solicitud, onClose }: DocumentPreviewModalProps) {
  if (!solicitud) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-serif font-semibold text-lg">Vista Previa del Documento</h3>
          <button onClick={onClose} className="icon-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
          <div>
            <p className="field-label">Radicado</p>
            <p className="font-medium">{solicitud.radicado}</p>
          </div>
          <div>
            <p className="field-label">Solicitante</p>
            <p className="font-medium">{solicitud.solicitante}</p>
          </div>
          <div>
            <p className="field-label">Identificación</p>
            <p className="font-medium">{solicitud.identificacion}</p>
          </div>
          <div>
            <p className="field-label">Categoría</p>
            <CategoryBadge category={solicitud.categoria} />
          </div>
          <div>
            <p className="field-label">Descripción</p>
            <p className="text-foreground">{solicitud.descripcion}</p>
          </div>
          <div className="doc-preview-placeholder">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{solicitud.documento}</p>
            <p className="text-xs text-muted-foreground mt-1">Vista previa del PDF no disponible en demo</p>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

/* ─── ApproveModal ────────────────────────────────────────── */
interface ApproveModalProps {
  solicitud: Solicitud | null
  onClose: () => void
  onConfirm: (id: string) => void
}

function ApproveModal({ solicitud, onClose, onConfirm }: ApproveModalProps) {
  if (!solicitud) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="modal-icon-wrap bg-success/10">
            <Check className="h-6 w-6 text-success" />
          </div>
          <h3 className="modal-title">Confirmar Aprobación</h3>
          <p className="modal-description">
            ¿Confirmar aprobación y firma digital de la solicitud {solicitud.radicado}?
          </p>
          <div className="modal-actions">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={() => onConfirm(solicitud.id)} className="btn-success flex-1">
              Confirmar firma
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── DeclineModal ────────────────────────────────────────── */
interface DeclineModalProps {
  solicitud: Solicitud | null
  onClose: () => void
  onConfirm: (id: string, motivo: string) => void
}

function DeclineModal({ solicitud, onClose, onConfirm }: DeclineModalProps) {
  const [motivo, setMotivo] = useState('')
  if (!solicitud) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="modal-icon-wrap bg-destructive/10">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="modal-title">Declinar Solicitud</h3>
          <p className="modal-description">
            Ingrese el motivo del rechazo para la solicitud {solicitud.radicado}
          </p>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Escriba el motivo del rechazo..."
            className="textarea-field"
          />
          <div className="modal-actions mt-4">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={() => onConfirm(solicitud.id, motivo)}
              disabled={!motivo.trim()}
              className="btn-danger flex-1"
            >
              Confirmar rechazo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function AsuntosPendientes() {
  const [searchQuery, setSearchQuery]           = useState('')
  const [selectedCategories, setSelectedCategories] = useState<SolicitudCategoria[]>([])
  const [showFilters, setShowFilters]           = useState(false)
  const [sortBy, setSortBy]                     = useState<'reciente' | 'antiguo' | 'nombre'>('reciente')
  const [fechaDesde, setFechaDesde]             = useState('')
  const [fechaHasta, setFechaHasta]             = useState('')
  const [currentPage, setCurrentPage]           = useState(1)
  const itemsPerPage = 5

  const [previewSolicitud, setPreviewSolicitud] = useState<Solicitud | null>(null)
  const [approveSolicitud, setApproveSolicitud] = useState<Solicitud | null>(null)
  const [declineSolicitud, setDeclineSolicitud] = useState<Solicitud | null>(null)

  const { search, aprobar, declinar } = useSolicitudesStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const filteredSolicitudes = useMemo(() =>
    search(searchQuery, {
      categorias: selectedCategories,
      estado: 'pendientes',
      fechaDesde,
      fechaHasta,
      ordenar: sortBy,
    }),
    [search, searchQuery, selectedCategories, fechaDesde, fechaHasta, sortBy]
  )

  const totalPages          = Math.ceil(filteredSolicitudes.length / itemsPerPage)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const toggleCategory = (category: SolicitudCategoria) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
    setCurrentPage(1)
  }

  const handleApprove = (id: string) => {
    aprobar(id)
    addNotification({ message: `Solicitud ${approveSolicitud?.radicado} aprobada exitosamente`, type: 'success' })
    setApproveSolicitud(null)
  }

  const handleDecline = (id: string, motivo: string) => {
    declinar(id, motivo)
    addNotification({ message: `Solicitud ${declineSolicitud?.radicado} declinada`, type: 'warning' })
    setDeclineSolicitud(null)
  }

  return (
    <AppLayout title="Asuntos Pendientes">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">Asuntos Pendientes</h2>
        <p className="text-muted-foreground">
          {filteredSolicitudes.length} solicitudes pendientes de revisión
        </p>
      </div>

      {/* Category pills */}
      <div className="filter-pill-row">
        {(Object.entries(CATEGORIES) as [SolicitudCategoria, typeof CATEGORIES[SolicitudCategoria]][]).map(([key, value]) => {
          const Icon = categoryIcons[key]
          const isSelected = selectedCategories.includes(key)
          return (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`filter-pill ${isSelected ? 'filter-pill-active' : 'filter-pill-inactive'}`}
            >
              <Icon className="h-4 w-4" />
              {value.label}
            </button>
          )
        })}
        <button
          onClick={() => setSelectedCategories([])}
          className={`filter-pill ${selectedCategories.length === 0 ? 'filter-pill-active' : 'filter-pill-inactive'}`}
        >
          Todas
        </button>
      </div>

      {/* Search + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, radicado o título..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="search-input"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle-btn"
        >
          <Filter className="h-5 w-5" />
          <span>Filtros</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="filter-panel">
          <div>
            <label className="field-label block mb-1.5">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="date" value={fechaDesde}
                onChange={e => { setFechaDesde(e.target.value); setCurrentPage(1) }}
                className="date-input" />
            </div>
          </div>
          <div>
            <label className="field-label block mb-1.5">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="date" value={fechaHasta}
                onChange={e => { setFechaHasta(e.target.value); setCurrentPage(1) }}
                className="date-input" />
            </div>
          </div>
          <div>
            <label className="field-label block mb-1.5">Ordenar por</label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={sortBy}
                onChange={e => setSortBy(e.target.value as 'reciente' | 'antiguo' | 'nombre')}
                className="date-input appearance-none">
                <option value="reciente">Más reciente</option>
                <option value="antiguo">Más antiguo</option>
                <option value="nombre">Nombre</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filteredSolicitudes.length === 0 ? (
        <EmptyState
          title="No hay solicitudes pendientes"
          description="No se encontraron solicitudes que coincidan con los filtros aplicados."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Categoría','Título','Solicitante','Fecha','Estado','Acciones'].map((h, i) => (
                    <th key={h} className={`table-th ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedSolicitudes.map(solicitud => (
                  <tr key={solicitud.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="table-td"><CategoryBadge category={solicitud.categoria} /></td>
                    <td className="table-td">
                      <p className="font-medium">{solicitud.titulo}</p>
                      <p className="text-sm text-muted-foreground">{solicitud.radicado}</p>
                    </td>
                    <td className="table-td text-foreground">{solicitud.solicitante}</td>
                    <td className="table-td text-muted-foreground">{solicitud.fechaIngreso}</td>
                    <td className="table-td"><StatusBadge status={solicitud.estado} /></td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setPreviewSolicitud(solicitud)} className="icon-btn" title="Vista previa">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setApproveSolicitud(solicitud)} className="icon-btn text-success hover:bg-success/10" title="Aprobar">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeclineSolicitud(solicitud)} className="icon-btn text-destructive hover:bg-destructive/10" title="Declinar">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {paginatedSolicitudes.map(solicitud => (
              <div key={solicitud.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <CategoryBadge category={solicitud.categoria} />
                  <StatusBadge status={solicitud.estado} />
                </div>
                <h3 className="font-medium text-foreground mb-1">{solicitud.titulo}</h3>
                <p className="text-sm text-muted-foreground mb-2">{solicitud.solicitante}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {solicitud.radicado} — {solicitud.fechaIngreso}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewSolicitud(solicitud)} className="mobile-card-btn bg-secondary text-secondary-foreground">
                    <Eye className="h-4 w-4" /> Ver
                  </button>
                  <button onClick={() => setApproveSolicitud(solicitud)} className="mobile-card-btn bg-success text-success-foreground">
                    <Check className="h-4 w-4" /> Aprobar
                  </button>
                  <button onClick={() => setDeclineSolicitud(solicitud)} className="mobile-card-btn bg-destructive text-destructive-foreground">
                    <X className="h-4 w-4" /> Declinar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DocumentPreviewModal solicitud={previewSolicitud} onClose={() => setPreviewSolicitud(null)} />
      <ApproveModal solicitud={approveSolicitud} onClose={() => setApproveSolicitud(null)} onConfirm={handleApprove} />
      <DeclineModal solicitud={declineSolicitud} onClose={() => setDeclineSolicitud(null)} onConfirm={handleDecline} />
    </AppLayout>
  )
}