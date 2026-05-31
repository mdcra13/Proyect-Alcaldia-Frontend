import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building,
  Calendar,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  Search,
  SortAsc,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import EmptyState from '@/components/ui/empty-state'
import ConfirmActionModal from '@/components/shared/ConfirmActionModal'
import DeclineModal from '@/components/shared/DeclineModal'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import useNotificationStore from '@/lib/stores/notificationStore'
import type {
  Solicitud,
  SolicitudCategoria,
  SolicitudEstado,
  SolicitudPrioridad,
} from '@/lib/types'

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
  pendiente: { label: 'Pendiente', color: 'status-pendiente' },
  en_revision: { label: 'En revisión', color: 'status-en-revision' },
  aprobado: { label: 'Aprobado', color: 'status-aprobado' },
  declinado: { label: 'Declinado', color: 'status-declinado' },
}

type EstadoFilter = 'todos' | 'pendientes' | SolicitudEstado
type PrioridadFilter = 'todas' | SolicitudPrioridad
type SortBy = 'reciente' | 'antiguo' | 'nombre'

const estadoOptions: { value: EstadoFilter; label: string }[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'declinado', label: 'Declinado' },
]

const prioridadOptions: { value: PrioridadFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'baja', label: 'LOW' },
  { value: 'media', label: 'MEDIUM' },
  { value: 'alta', label: 'HIGH' },
]

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'antiguo', label: 'Más antiguo' },
  { value: 'nombre', label: 'Nombre del solicitante' },
]

const validEstados = new Set<EstadoFilter>(estadoOptions.map(option => option.value))
const validPrioridades = new Set<PrioridadFilter>(prioridadOptions.map(option => option.value))
const validSortOptions = new Set<SortBy>(sortOptions.map(option => option.value))
const validCategorias = new Set<SolicitudCategoria>(
  Object.keys(CATEGORIES) as SolicitudCategoria[],
)

interface StatusBadgeProps {
  status: SolicitudEstado
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusLabels[status] ?? statusLabels.pendiente

  return <span className={`status-badge ${config.color}`}>{config.label}</span>
}

interface CategoryBadgeProps {
  category: SolicitudCategoria
}

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

export default function AsuntosPendientes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const [previewSolicitud, setPreviewSolicitud] = useState<Solicitud | null>(null)
  const [approveSolicitud, setApproveSolicitud] = useState<Solicitud | null>(null)
  const [declineSolicitud, setDeclineSolicitud] = useState<Solicitud | null>(null)

  const { search, aprobar } = useSolicitudesStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const searchQuery = searchParams.get('q') ?? ''
  const fechaDesde = searchParams.get('desde') ?? ''
  const fechaHasta = searchParams.get('hasta') ?? ''

  const estadoParam = searchParams.get('estado') as EstadoFilter | null
  const prioridadParam = searchParams.get('prioridad') as PrioridadFilter | null
  const sortParam = searchParams.get('orden') as SortBy | null

  const estadoFilter: EstadoFilter =
    estadoParam && validEstados.has(estadoParam) ? estadoParam : 'pendientes'

  const prioridadFilter: PrioridadFilter =
    prioridadParam && validPrioridades.has(prioridadParam) ? prioridadParam : 'todas'

  const sortBy: SortBy =
    sortParam && validSortOptions.has(sortParam) ? sortParam : 'reciente'

  const selectedCategories = (searchParams.get('categoria') ?? '')
    .split(',')
    .filter((category): category is SolicitudCategoria =>
      validCategorias.has(category as SolicitudCategoria),
    )

  const activeFiltersCount = [
    searchQuery,
    selectedCategories.length > 0,
    estadoFilter !== 'pendientes',
    prioridadFilter !== 'todas',
    fechaDesde,
    fechaHasta,
    sortBy !== 'reciente',
  ].filter(Boolean).length

  const updateFilters = (updates: {
    q?: string
    categoria?: SolicitudCategoria[]
    estado?: EstadoFilter
    prioridad?: PrioridadFilter
    desde?: string
    hasta?: string
    orden?: SortBy
  }) => {
    const nextParams = new URLSearchParams(searchParams)

    if (updates.q !== undefined) {
      updates.q ? nextParams.set('q', updates.q) : nextParams.delete('q')
    }

    if (updates.categoria !== undefined) {
      updates.categoria.length > 0
        ? nextParams.set('categoria', updates.categoria.join(','))
        : nextParams.delete('categoria')
    }

    if (updates.estado !== undefined) {
      updates.estado !== 'pendientes'
        ? nextParams.set('estado', updates.estado)
        : nextParams.delete('estado')
    }

    if (updates.prioridad !== undefined) {
      updates.prioridad !== 'todas'
        ? nextParams.set('prioridad', updates.prioridad)
        : nextParams.delete('prioridad')
    }

    if (updates.desde !== undefined) {
      updates.desde ? nextParams.set('desde', updates.desde) : nextParams.delete('desde')
    }

    if (updates.hasta !== undefined) {
      updates.hasta ? nextParams.set('hasta', updates.hasta) : nextParams.delete('hasta')
    }

    if (updates.orden !== undefined) {
      updates.orden !== 'reciente'
        ? nextParams.set('orden', updates.orden)
        : nextParams.delete('orden')
    }

    setSearchParams(nextParams, { replace: true })
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchParams({}, { replace: true })
    setCurrentPage(1)
  }

  const filteredSolicitudes = useMemo(
    () =>
      search(searchQuery, {
        categorias: selectedCategories,
        estado: estadoFilter,
        prioridad: prioridadFilter,
        fechaDesde,
        fechaHasta,
        ordenar: sortBy,
      }),
    [
      search,
      searchQuery,
      selectedCategories,
      estadoFilter,
      prioridadFilter,
      fechaDesde,
      fechaHasta,
      sortBy,
    ],
  )

  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const toggleCategory = (category: SolicitudCategoria) => {
    updateFilters(
      selectedCategories.includes(category)
        ? { categoria: selectedCategories.filter(item => item !== category) }
        : { categoria: [...selectedCategories, category] },
    )
  }

  const handleApprove = () => {
    if (!approveSolicitud) return

    aprobar(approveSolicitud.id)
    addNotification({
      message: `Solicitud ${approveSolicitud.radicado} aprobada exitosamente`,
      type: 'success',
    })
    setApproveSolicitud(null)
  }

  const handleDeclined = () => {
    if (!declineSolicitud) return

    addNotification({
      message: `Solicitud ${declineSolicitud.radicado} declinada`,
      type: 'warning',
    })
    setDeclineSolicitud(null)
  }

  return (
    <AppLayout title="Asuntos Pendientes">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">
          Asuntos Pendientes
        </h2>
        <p className="text-muted-foreground">
          {filteredSolicitudes.length} solicitudes pendientes de revisión
        </p>
      </div>

      <div className="filter-pill-row">
        {(Object.entries(CATEGORIES) as [SolicitudCategoria, typeof CATEGORIES[SolicitudCategoria]][]).map(
          ([key, value]) => {
            const Icon = categoryIcons[key]
            const isSelected = selectedCategories.includes(key)

            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategory(key)}
                className={`filter-pill ${isSelected ? 'filter-pill-active' : 'filter-pill-inactive'}`}
              >
                <Icon className="h-4 w-4" />
                {value.label}
              </button>
            )
          },
        )}

        <button
          type="button"
          onClick={() => updateFilters({ categoria: [] })}
          className={`filter-pill ${selectedCategories.length === 0 ? 'filter-pill-active' : 'filter-pill-inactive'}`}
        >
          Todas
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, radicado o título..."
            value={searchQuery}
            onChange={event => updateFilters({ q: event.target.value })}
            className="search-input"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle-btn"
        >
          <Filter className="h-5 w-5" />
          <span>Filtros</span>

          {activeFiltersCount > 0 && (
            <span className="notification-badge static h-5 min-w-5">
              {activeFiltersCount}
            </span>
          )}

          <ChevronDown
            className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div>
            <label className="field-label block mb-1.5">Estado</label>
            <select
              value={estadoFilter}
              onChange={event => updateFilters({ estado: event.target.value as EstadoFilter })}
              className="date-input appearance-none"
            >
              {estadoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label block mb-1.5">Prioridad</label>
            <select
              value={prioridadFilter}
              onChange={event =>
                updateFilters({ prioridad: event.target.value as PrioridadFilter })
              }
              className="date-input appearance-none"
            >
              {prioridadOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label block mb-1.5">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={fechaDesde}
                onChange={event => updateFilters({ desde: event.target.value })}
                className="date-input"
              />
            </div>
          </div>

          <div>
            <label className="field-label block mb-1.5">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={fechaHasta}
                onChange={event => updateFilters({ hasta: event.target.value })}
                className="date-input"
              />
            </div>
          </div>

          <div>
            <label className="field-label block mb-1.5">Ordenar por</label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={event => updateFilters({ orden: event.target.value as SortBy })}
                className="date-input appearance-none"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary w-full"
              disabled={activeFiltersCount === 0}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {filteredSolicitudes.length === 0 ? (
        <EmptyState
          title="No hay solicitudes pendientes"
          description="No se encontraron solicitudes que coincidan con los filtros aplicados."
        />
      ) : (
        <>
          <div className="hidden lg:block bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Categoría', 'Título', 'Solicitante', 'Fecha', 'Estado', 'Acciones'].map(
                    (heading, index) => (
                      <th
                        key={heading}
                        className={`table-th ${index === 5 ? 'text-right' : 'text-left'}`}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {paginatedSolicitudes.map(solicitud => (
                  <tr
                    key={solicitud.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="table-td">
                      <CategoryBadge category={solicitud.categoria} />
                    </td>

                    <td className="table-td">
                      <p className="font-medium">{solicitud.titulo}</p>
                      <p className="text-sm text-muted-foreground">{solicitud.radicado}</p>
                    </td>

                    <td className="table-td text-foreground">{solicitud.solicitante}</td>
                    <td className="table-td text-muted-foreground">{solicitud.fechaIngreso}</td>

                    <td className="table-td">
                      <StatusBadge status={solicitud.estado} />
                    </td>

                    <td className="table-td">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewSolicitud(solicitud)}
                          className="icon-btn"
                          title="Vista previa"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setApproveSolicitud(solicitud)}
                          className="icon-btn text-success hover:bg-success/10"
                          title="Aprobar"
                        >
                          <Check className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeclineSolicitud(solicitud)}
                          className="icon-btn text-destructive hover:bg-destructive/10"
                          title="Declinar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                  <button
                    type="button"
                    onClick={() => setPreviewSolicitud(solicitud)}
                    className="mobile-card-btn bg-secondary text-secondary-foreground"
                  >
                    <Eye className="h-4 w-4" /> Ver
                  </button>

                  <button
                    type="button"
                    onClick={() => setApproveSolicitud(solicitud)}
                    className="mobile-card-btn bg-success text-success-foreground"
                  >
                    <Check className="h-4 w-4" /> Aprobar
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeclineSolicitud(solicitud)}
                    className="mobile-card-btn bg-destructive text-destructive-foreground"
                  >
                    <X className="h-4 w-4" /> Declinar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {previewSolicitud && (
        <DocumentPreviewModal
          open={Boolean(previewSolicitud)}
          solicitud={previewSolicitud}
          onClose={() => setPreviewSolicitud(null)}
          onApprove={(id) => {
            setPreviewSolicitud(null)
            const solicitud = filteredSolicitudes.find(item => item.id === id)
            if (solicitud) setApproveSolicitud(solicitud)
          }}
          onDecline={(id) => {
            setPreviewSolicitud(null)
            const solicitud = filteredSolicitudes.find(item => item.id === id)
            if (solicitud) setDeclineSolicitud(solicitud)
          }}
        />
      )}

      <ConfirmActionModal
        open={Boolean(approveSolicitud)}
        titulo="Confirmar aprobación"
        mensaje={`¿Confirmar aprobación y firma digital de la solicitud ${approveSolicitud?.radicado ?? ''}?`}
        etiquetaConfirmar="Confirmar firma"
        etiquetaCancelar="Cancelar"
        variante="exito"
        alConfirmar={handleApprove}
        alCancelar={() => setApproveSolicitud(null)}
      />

      {declineSolicitud && (
        <DeclineModal
          open={Boolean(declineSolicitud)}
          solicitudId={declineSolicitud.id}
          onClose={() => setDeclineSolicitud(null)}
          onDeclined={handleDeclined}
        />
      )}
    </AppLayout>
  )
}