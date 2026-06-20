import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { FechaLimiteBadge } from '@/components/shared/FechaLimiteBadge'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import SolicitudFiltersPanel from '@/components/shared/SolicitudFiltersPanel'
import { useSolicitudFilters } from '@/lib/hooks/useSolicitudFilters'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { Solicitud, SolicitudEstado } from '@/lib/types'

const ITEMS_PER_PAGE = 10

const ESTADOS_ACCIONABLES_DEPTO: SolicitudEstado[] = [
  'assigned_to_department',
  'in_review',
  'returned_to_department',
]

export default function NotasPendientes() {
  const user = useAuthStore(state => state.user)
  const {
    solicitudes,
    getPendientesDepartamento,
    aprobarDepartamento,
    declinar,
  } = useSolicitudesStore()

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
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const departamentoNombre = user?.departamento?.nombre ?? 'Mi Departamento'

  // Base: notas accionables del departamento del usuario
  const notasDepartamento = useMemo(() => {
    if (!user?.departamentoId) return []

    if (getPendientesDepartamento) {
      return getPendientesDepartamento(user.departamentoId)
    }

    return solicitudes.filter(solicitud =>
      solicitud.departamentoId === user.departamentoId &&
      ESTADOS_ACCIONABLES_DEPTO.includes(solicitud.estado)
    )
  }, [getPendientesDepartamento, solicitudes, user?.departamentoId])

  // Aplicar filtros del panel compartido sobre la base ya acotada al departamento
  const filteredSolicitudes = useMemo(() => {
    let results = [...notasDepartamento]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(solicitud =>
        solicitud.radicado.toLowerCase().includes(query) ||
        solicitud.titulo.toLowerCase().includes(query) ||
        solicitud.solicitante.toLowerCase().includes(query) ||
        solicitud.identificacion.toLowerCase().includes(query)
      )
    }

    // El filtro de estado solo aplica si coincide con uno de los estados accionables;
    // de lo contrario no tendría sentido en esta pantalla (todas ya son accionables)
    if (estado !== 'todos') {
      results = results.filter(solicitud => solicitud.estado === estado)
    }

    if (categoria !== 'todos') {
      results = results.filter(solicitud => solicitud.categoria === categoria)
    }

    if (prioridad !== 'todos') {
      results = results.filter(solicitud => solicitud.prioridad === prioridad)
    }

    if (fechaDesde) {
      results = results.filter(solicitud => solicitud.fechaLimite >= fechaDesde)
    }

    if (fechaHasta) {
      results = results.filter(solicitud => solicitud.fechaLimite <= fechaHasta)
    }

    return results.sort(
      (a, b) =>
        new Date(a.fechaLimite).getTime() -
        new Date(b.fechaLimite).getTime()
    )
  }, [notasDepartamento, searchQuery, estado, categoria, prioridad, fechaDesde, fechaHasta])

  const totalPages = Math.max(1, Math.ceil(filteredSolicitudes.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedSolicitudes = filteredSolicitudes.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  )

  const goToPage = (page: number) => updateFilter('page', String(page))

  const handleViewDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowDetailModal(true)
  }

  const handleOpenApprove = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowApproveModal(true)
  }

  const handleOpenDecline = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setMotivoRechazo('')
    setFormError('')
    setShowDeclineModal(true)
  }

  const handleApprove = async () => {
    if (!selectedSolicitud || !user) return

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 400))

    aprobarDepartamento(
      selectedSolicitud.id,
      user.id,
      `${user.nombre} ${user.apellido}`
    )

    setIsSubmitting(false)
    setShowApproveModal(false)
    setShowDetailModal(false)
    setSelectedSolicitud(null)
  }

  const handleDecline = async () => {
    if (!selectedSolicitud || !user) return

    if (motivoRechazo.trim().length < 10) {
      setFormError('El motivo debe tener al menos 10 caracteres.')
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 400))

    declinar(
      selectedSolicitud.id,
      motivoRechazo.trim(),
      user.id,
      `${user.nombre} ${user.apellido}`
    )

    setIsSubmitting(false)
    setShowDeclineModal(false)
    setShowDetailModal(false)
    setMotivoRechazo('')
    setFormError('')
    setSelectedSolicitud(null)
  }

  return (
    <AppLayout title="Notas pendientes">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl font-bold text-primary">
            Notas pendientes
          </h1>
          <p className="text-muted-foreground">
            Solicitudes asignadas al departamento de {departamentoNombre}.
          </p>
        </div>

        <SolicitudFiltersPanel
          idPrefix="notas-pendientes"
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
              Notas pendientes de revisión
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredSolicitudes.length} nota(s) encontrada(s)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground">Radicado</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Título</th>
                  <th className="hidden p-4 text-left font-medium text-muted-foreground md:table-cell">
                    Solicitante
                  </th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Fecha límite</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="p-4 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {paginatedSolicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      {hasActiveFilters
                        ? 'No hay notas que coincidan con los filtros seleccionados.'
                        : 'No hay notas pendientes para este departamento.'}
                    </td>
                  </tr>
                ) : (
                  paginatedSolicitudes.map(solicitud => (
                    <tr key={solicitud.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-4">
                        <span className="font-mono text-sm">{solicitud.radicado}</span>
                      </td>

                      <td className="p-4">
                        <p className="max-w-[220px] truncate font-medium">
                          {solicitud.titulo}
                        </p>
                      </td>

                      <td className="hidden p-4 md:table-cell">
                        <span className="text-sm">{solicitud.solicitante}</span>
                      </td>

                      <td className="p-4">
                        <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
                      </td>

                      <td className="p-4">
                        <EstadoBadge estado={solicitud.estado} />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(solicitud)}
                            className="icon-button hover:bg-secondary"
                            title="Ver detalle"
                            aria-label={`Ver detalle de ${solicitud.radicado}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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
                {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredSolicitudes.length)} de{' '}
                {filteredSolicitudes.length} notas
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm">
                  Página {safeCurrentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {showDetailModal && selectedSolicitud && (
          <DocumentPreviewModal
            solicitud={selectedSolicitud}
            open={showDetailModal}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedSolicitud(null)
            }}
            onApprove={() => handleOpenApprove(selectedSolicitud)}
            onDecline={() => handleOpenDecline(selectedSolicitud)}
          />
        )}

        {showApproveModal && selectedSolicitud && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
              <div className="border-b border-border px-6 py-4">
                <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-green-600">
                  Aprobar solicitud
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Al aprobar esta solicitud, será enviada al alcalde para revisión final.
                </p>
              </div>

              <div className="space-y-1 px-6 py-4 text-sm">
                <p><strong>Radicado:</strong> {selectedSolicitud.radicado}</p>
                <p><strong>Título:</strong> {selectedSolicitud.titulo}</p>
                <p><strong>Solicitante:</strong> {selectedSolicitud.solicitante}</p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Aprobando...' : 'Confirmar aprobación'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeclineModal && selectedSolicitud && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
              <div className="border-b border-border px-6 py-4">
                <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-red-600">
                  Rechazar solicitud
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Indica el motivo del rechazo. Esta información será visible para la secretaria.
                </p>
              </div>

              <div className="space-y-4 px-6 py-4">
                <div className="text-sm">
                  <p><strong>Radicado:</strong> {selectedSolicitud.radicado}</p>
                  <p className="mt-1"><strong>Título:</strong> {selectedSolicitud.titulo}</p>
                </div>

                <div>
                  <label
                    htmlFor="motivo-rechazo"
                    className="mb-1 block text-sm font-medium text-foreground"
                  >
                    Motivo del rechazo *
                  </label>
                  <textarea
                    id="motivo-rechazo"
                    placeholder="Explique el motivo del rechazo..."
                    value={motivoRechazo}
                    onChange={event => {
                      setMotivoRechazo(event.target.value)
                      setFormError('')
                    }}
                    rows={4}
                    maxLength={500}
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                  />
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-xs text-red-600">{formError}</p>
                    <p className="ml-auto text-xs text-muted-foreground">
                      {motivoRechazo.length}/500
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isSubmitting || motivoRechazo.trim().length < 10}
                  className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Rechazando...' : 'Confirmar rechazo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}