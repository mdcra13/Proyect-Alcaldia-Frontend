import { Filter, Search } from 'lucide-react'
import { CATEGORIES } from '@/lib/stores/solicitudesStore'
import {
  ESTADO_CONFIG,
  PRIORIDAD_LABELS,
  type Departamento,
} from '@/lib/types'
import type { SolicitudFilterKey } from '@/lib/hooks/useSolicitudFilters'

interface SolicitudFiltersPanelProps {
  idPrefix: string
  departamentos: Departamento[]
  searchQuery: string
  estado: string
  departamento: string
  categoria: string
  prioridad: string
  fechaDesde: string
  fechaHasta: string
  activeFiltersCount: number
  hasActiveFilters: boolean
  updateFilter: (key: SolicitudFilterKey, value: string) => void
  clearFilters: () => void
}

export default function SolicitudFiltersPanel({
  idPrefix,
  departamentos,
  searchQuery,
  estado,
  departamento,
  categoria,
  prioridad,
  fechaDesde,
  fechaHasta,
  activeFiltersCount,
  hasActiveFilters,
  updateFilter,
  clearFilters,
}: SolicitudFiltersPanelProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Filtros</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <label htmlFor={`${idPrefix}-search`} className="sr-only">
            Buscar
          </label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={`${idPrefix}-search`}
            type="text"
            placeholder="Buscar por radicado, título, solicitante o identificación..."
            value={searchQuery}
            onChange={event => updateFilter('q', event.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          aria-label="Estado"
          value={estado}
          onChange={event => updateFilter('estado', event.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendientes">Pendientes</option>
          <option value="en_proceso">En proceso</option>
          <option value="aprobado">Aprobadas</option>
          <option value="declinado">Declinadas</option>
          {Object.entries(ESTADO_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Departamento"
          value={departamento}
          onChange={event => updateFilter('departamento', event.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todos los departamentos</option>
          {departamentos.map(item => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <select
          aria-label="Categoría"
          value={categoria}
          onChange={event => updateFilter('categoria', event.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todas las categorías</option>
          {Object.entries(CATEGORIES).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Prioridad"
          value={prioridad}
          onChange={event => updateFilter('prioridad', event.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="todos">Todas las prioridades</option>
          {Object.entries(PRIORIDAD_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <input
          aria-label="Fecha desde"
          type="date"
          value={fechaDesde}
          onChange={event => updateFilter('desde', event.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />

        <input
          aria-label="Fecha hasta"
          type="date"
          value={fechaHasta}
          onChange={event => updateFilter('hasta', event.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
  )
}