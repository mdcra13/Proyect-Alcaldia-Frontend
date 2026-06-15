import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Search,
  X,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { CambiarDepartamentoModal } from '@/components/shared/CambiarDepartamentoModal'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { FechaLimiteBadge } from '@/components/shared/FechaLimiteBadge'
import { HistorialTimeline } from '@/components/shared/HistorialTimeline'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import { ESTADO_CONFIG } from '@/lib/types'
import type { Solicitud, SolicitudEstado } from '@/lib/types'

const ITEMS_PER_PAGE = 10

const ESTADOS_FINALES: SolicitudEstado[] = [
  'rejected_by_department',
  'rejected_by_mayor_office',
  'signed',
  'closed',
]

type EstadoFilter = SolicitudEstado | 'todos'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const solicitudes = useSolicitudesStore(state => state.solicitudes)
  const getDepartamentosActivos = useDepartamentosStore(
  state => state.getDepartamentosActivos,
  )

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>(
    (searchParams.get('estado') as EstadoFilter | null) ?? 'todos',
  )
  const [departamentoFilter, setDepartamentoFilter] = useState(
    searchParams.get('dep') ?? 'todos',
  )
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showChangeDeptModal, setShowChangeDeptModal] = useState(false)

  const departamentos = getDepartamentosActivos()
  useEffect(() => {
    const params = new URLSearchParams()

    if (searchQuery) params.set('q', searchQuery)
    if (estadoFilter !== 'todos') params.set('estado', estadoFilter)
    if (departamentoFilter !== 'todos') params.set('dep', departamentoFilter)

    setSearchParams(params, { replace: true })
  }, [searchQuery, estadoFilter, departamentoFilter, setSearchParams])

  const filteredSolicitudes = useMemo(() => {
    if (!user) return []

    let results = solicitudes.filter(solicitud => solicitud.subidoPorId === user.id)

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()

      results = results.filter(
        solicitud =>
          solicitud.radicado.toLowerCase().includes(query) ||
          solicitud.solicitante.toLowerCase().includes(query) ||
          solicitud.titulo.toLowerCase().includes(query),
      )
    }

    if (estadoFilter !== 'todos') {
      results = results.filter(solicitud => solicitud.estado === estadoFilter)
    }

    if (departamentoFilter !== 'todos') {
      results = results.filter(
        solicitud => solicitud.departamentoId === departamentoFilter,
      )
    }

    return [...results].sort(
      (a, b) =>
        new Date(a.fechaLimite).getTime() -
        new Date(b.fechaLimite).getTime(),
    )
  }, [user, solicitudes, searchQuery, estadoFilter, departamentoFilter])

  const totalPages = Math.ceil(filteredSolicitudes.length / ITEMS_PER_PAGE)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handleExportCSV = () => {
    const headers = [
      'Radicado',
      'Título',
      'Solicitante',
      'Departamento',
      'Fecha límite',
      'Estado',
    ]

    const rows = filteredSolicitudes.map(solicitud => [
      solicitud.radicado,
      solicitud.titulo,
      solicitud.solicitante,
      solicitud.departamento?.nombre ?? '',
      solicitud.fechaLimite,
      ESTADO_CONFIG[solicitud.estado].label,
    ])

    downloadCSV(
      `notas_${new Date().toISOString().split('T')[0]}.csv`,
      [headers, ...rows],
    )
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleEstadoChange = (value: string) => {
    setEstadoFilter(value as EstadoFilter)
    setCurrentPage(1)
  }

  const handleDepartamentoChange = (value: string) => {
    setDepartamentoFilter(value)
    setCurrentPage(1)
  }

  const handleViewDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowDetailModal(true)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedSolicitud(null)
  }

  const handleChangeDepartment = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowChangeDeptModal(true)
  }

  return (
    <AppLayout title="Mis Notas">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary">
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

        <div className="rounded-xl border border-border bg-card">
          <div className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <label htmlFor="notas-search" className="sr-only">
                  Buscar notas
                </label>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="notas-search"
                  type="text"
                  placeholder="Buscar por radicado, título o solicitante..."
                  value={searchQuery}
                  onChange={event => handleSearchChange(event.target.value)}
                  className="form-input pl-9"
                />
              </div>

              <div>
                <label htmlFor="estado-filter" className="sr-only">
                  Filtrar por estado
                </label>
                <select
                  id="estado-filter"
                  value={estadoFilter}
                  onChange={event => handleEstadoChange(event.target.value)}
                  className="form-input custom-select w-full lg:w-[220px]"
                >
                  <option value="todos">Todos los estados</option>
                  {(Object.entries(ESTADO_CONFIG) as [
                    SolicitudEstado,
                    typeof ESTADO_CONFIG[SolicitudEstado],
                  ][]).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="departamento-filter" className="sr-only">
                  Filtrar por departamento
                </label>
                <select
                  id="departamento-filter"
                  value={departamentoFilter}
                  onChange={event => handleDepartamentoChange(event.target.value)}
                  className="form-input custom-select w-full lg:w-[220px]"
                >
                  <option value="todos">Todos los departamentos</option>
                  {departamentos.map(departamento => (
                    <option key={departamento.id} value={departamento.id}>
                      {departamento.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Radicado
                  </th>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Título
                  </th>
                  <th className="hidden p-4 text-left font-medium text-muted-foreground md:table-cell">
                    Departamento
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
                      colSpan={6}
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
                          <p className="max-w-[200px] truncate font-medium">
                            {solicitud.titulo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {solicitud.solicitante}
                          </p>
                        </div>
                      </td>

                      <td className="hidden p-4 md:table-cell">
                        <span className="text-sm">
                          {solicitud.departamento?.nombre ?? 'Sin asignar'}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredSolicitudes.length)} de{' '}
                {filteredSolicitudes.length} notas
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(page => page - 1)}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(page => page + 1)}
                  disabled={currentPage === totalPages}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="font-serif text-xl font-semibold text-foreground">
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
                    <p className="text-sm text-muted-foreground">Título</p>
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
                    <p className="text-sm text-muted-foreground">Identificación</p>
                    <p className="font-medium">
                      {selectedSolicitud.identificacion}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Departamento</p>
                    <p className="font-medium">
                      {selectedSolicitud.departamento?.nombre ?? 'Sin asignar'}
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