import { useRef, useState } from 'react'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'
import AppLayout from '@/components/layout/AppLayout'
import AccessibleDialog from '@/components/shared/AccessibleDialog'
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
import { decodeText } from '@/lib/utils'
import type { Solicitud } from '@/lib/types'

const ITEMS_PER_PAGE = 10

export default function NotasPendientes() {
  const user = useAuthStore(state => state.user)
  const {
    getPendientesDepartamento,
    aprobarDepartamento,
    reenviarConCorrecciones,
    declinar,
  } = useSolicitudesStore()

  const {
    searchQuery,
    identificadorQuery,
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
  const [showDetailModal, setShowDetailModal]   = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [motivoRechazo, setMotivoRechazo]       = useState('')
  const [formError, setFormError]               = useState('')
  const [isSubmitting, setIsSubmitting]         = useState(false)
  const [correctionFile, setCorrectionFile]     = useState<File | null>(null)
  const [correctionFileError, setCorrectionFileError] = useState('')

  // Refs para restaurar foco al botón que abrió cada modal
  const approveButtonRef = useRef<HTMLButtonElement | null>(null)
  const declineButtonRef = useRef<HTMLButtonElement | null>(null)
  const detailButtonRef  = useRef<HTMLButtonElement | null>(null)

  const departamentoNombre = user?.departamento?.nombre ?? 'Mi Departamento'

  const notasDepartamento = user?.departamentoId
    ? getPendientesDepartamento(user.departamentoId)
    : []

  const filteredSolicitudes = useFilteredSolicitudes(
    notasDepartamento,
    { searchQuery, identificadorQuery, estado, categoria, prioridad, fechaDesde, fechaHasta },
    'fechaLimite-asc',
  )

  const { totalPages, safeCurrentPage, paginatedItems: paginatedSolicitudes } =
    usePaginatedList(filteredSolicitudes, currentPage, ITEMS_PER_PAGE)

  const goToPage = (page: number) => updateFilter('page', String(page))

  /* ── Handlers ────────────────────────────────────────────── */

  const handleViewDetail = (solicitud: Solicitud, trigger: HTMLButtonElement) => {
    detailButtonRef.current = trigger
    setSelectedSolicitud(solicitud)
    setShowDetailModal(true)
  }

  const handleOpenApprove = (solicitud: Solicitud, trigger?: HTMLButtonElement | null) => {
    if (trigger) approveButtonRef.current = trigger
    setSelectedSolicitud(solicitud)
    setShowApproveModal(true)
    setShowDetailModal(false)
    setCorrectionFile(null)
    setCorrectionFileError('')
  }

  const handleOpenDecline = (solicitud: Solicitud, trigger?: HTMLButtonElement | null) => {
    if (trigger) declineButtonRef.current = trigger
    setSelectedSolicitud(solicitud)
    setMotivoRechazo('')
    setFormError('')
    setShowDeclineModal(true)
    setShowDetailModal(false)
  }

  const handleCloseApprove = () => {
    setShowApproveModal(false)
    setSelectedSolicitud(null)
    setCorrectionFile(null)
    setCorrectionFileError('')
    // AccessibleDialog ya restaura el foco al elemento anterior al montarse,
    // pero si el modal fue abierto desde otro modal (detail → approve) el ref
    // garantiza el destino correcto.
    approveButtonRef.current?.focus()
  }

  const handleCloseDecline = () => {
    setShowDeclineModal(false)
    setSelectedSolicitud(null)
    setMotivoRechazo('')
    setFormError('')
    declineButtonRef.current?.focus()
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedSolicitud(null)
    detailButtonRef.current?.focus()
  }

  const handleApprove = async () => {
    if (!selectedSolicitud || !user) return
    const isResubmission = selectedSolicitud.estado === 'returned_to_department'
    if (isResubmission && !correctionFile) {
      setCorrectionFileError('Debes adjuntar el documento corregido o faltante.')
      return
    }
    setIsSubmitting(true)
    try {
      if (isResubmission && correctionFile) {
        await reenviarConCorrecciones(
          selectedSolicitud.id,
          correctionFile,
          user.id,
          `${user.nombre} ${user.apellido}`,
        )
      } else {
        await aprobarDepartamento(selectedSolicitud.id, user.id, `${user.nombre} ${user.apellido}`)
      }
      setShowApproveModal(false)
      setSelectedSolicitud(null)
      setCorrectionFile(null)
      setCorrectionFileError('')
      toast.success(isResubmission ? 'Correcciones reenviadas a Alcaldía' : 'Solicitud enviada a Alcaldía')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo aprobar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (!selectedSolicitud || !user) return
    if (motivoRechazo.trim().length < 10) {
      setFormError('El motivo debe tener al menos 10 caracteres.')
      return
    }
    setIsSubmitting(true)
    try {
      await declinar(selectedSolicitud.id, motivoRechazo.trim(), user.id, `${user.nombre} ${user.apellido}`)
      setShowDeclineModal(false)
      setMotivoRechazo('')
      setFormError('')
      setSelectedSolicitud(null)
      toast.success('Solicitud rechazada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo rechazar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Render ──────────────────────────────────────────────── */

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
          headingLevel={2}
          idPrefix="notas-pendientes"
          departamentos={[]}
          searchQuery={searchQuery}
          identificadorQuery={identificadorQuery}
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
              <SolicitudesTableHeader />
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
                    <SolicitudTableRow
                      key={solicitud.id}
                      solicitud={solicitud}
                      actions={
                        <button
                          type="button"
                          onClick={e => handleViewDetail(solicitud, e.currentTarget)}
                          className="icon-button hover:bg-secondary"
                          aria-label={`Ver detalle de ${solicitud.radicado}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" focusable="false" />
                        </button>
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

        {/* ── Modal: Detalle ─────────────────────────────────── */}
        {showDetailModal && selectedSolicitud && (
          <DocumentPreviewModal
            solicitud={selectedSolicitud}
            open={showDetailModal}
            onClose={handleCloseDetail}
            onApprove={() => handleOpenApprove(selectedSolicitud)}
            onDecline={() => handleOpenDecline(selectedSolicitud)}
            approveLabel={selectedSolicitud.estado === 'returned_to_department' ? 'Reenviar a Alcaldía' : undefined}
          />
        )}

        {/* ── Modal: Aprobar ─────────────────────────────────── */}
        {showApproveModal && selectedSolicitud && (
          <AccessibleDialog
            titleId="approve-modal-title"
            descriptionId="approve-modal-desc"
            onClose={handleCloseApprove}
            className="modal-card max-w-md"
          >
            <div className="modal-header">
              <h2
                id="approve-modal-title"
                className="font-serif text-xl font-semibold text-success"
              >
                {selectedSolicitud.estado === 'returned_to_department'
                  ? 'Reenviar solicitud corregida'
                  : 'Aprobar solicitud'}
              </h2>
              <p id="approve-modal-desc" className="mt-2 text-sm text-muted-foreground">
                {selectedSolicitud.estado === 'returned_to_department'
                  ? 'Adjunta el documento corregido o faltante solicitado por Alcaldía.'
                  : 'Al aprobar esta solicitud, será enviada al alcalde para revisión final.'}
              </p>
            </div>

            <div className="space-y-1 px-6 py-4 text-sm">
              <p><strong>Código de seguimiento:</strong> {selectedSolicitud.radicado}</p>
              <p><strong>Identificador:</strong> {selectedSolicitud.titulo}</p>
              <p><strong>Solicitante:</strong> {decodeText(selectedSolicitud.solicitante)}</p>
              {selectedSolicitud.estado === 'returned_to_department' && (
                <div className="mt-4 space-y-2">
                  <label htmlFor="correction-document" className="block font-medium">
                    Documento corregido o faltante *
                  </label>
                  <input
                    id="correction-document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={event => {
                      const file = event.target.files?.[0] ?? null
                      setCorrectionFileError('')
                      if (file && !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                        setCorrectionFile(null)
                        setCorrectionFileError('Solo se permiten archivos PDF, JPG, PNG o WebP.')
                        return
                      }
                      if (file && file.size > 10 * 1024 * 1024) {
                        setCorrectionFile(null)
                        setCorrectionFileError('El archivo no debe superar los 10 MB.')
                        return
                      }
                      setCorrectionFile(file)
                    }}
                    className="modal-form-field"
                    aria-invalid={correctionFileError ? true : undefined}
                    aria-describedby={correctionFileError ? 'correction-file-error' : undefined}
                  />
                  {correctionFileError && (
                    <p id="correction-file-error" role="alert" className="text-xs text-destructive">
                      {correctionFileError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseApprove}
                disabled={isSubmitting || (selectedSolicitud.estado === 'returned_to_department' && !correctionFile)}
                className="modal-btn-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="modal-btn-success"
              >
                {isSubmitting
                  ? 'Enviando...'
                  : selectedSolicitud.estado === 'returned_to_department'
                    ? 'Reenviar a Alcaldía'
                    : 'Confirmar aprobación'}
              </button>
            </div>
          </AccessibleDialog>
        )}

        {/* ── Modal: Rechazar ────────────────────────────────── */}
        {showDeclineModal && selectedSolicitud && (
          <AccessibleDialog
            titleId="decline-modal-title"
            descriptionId="decline-modal-desc"
            onClose={handleCloseDecline}
            className="modal-card max-w-md"
          >
            <div className="modal-header">
              <h2
                id="decline-modal-title"
                className="font-serif text-xl font-semibold text-destructive"
              >
                Rechazar solicitud
              </h2>
              <p id="decline-modal-desc" className="mt-2 text-sm text-muted-foreground">
                Indica el motivo del rechazo. Esta información será visible para la secretaria.
              </p>
            </div>

            <div className="space-y-4 px-6 py-4">
              <div className="text-sm">
                <p><strong>Código de seguimiento:</strong> {selectedSolicitud.radicado}</p>
                <p className="mt-1"><strong>Identificador:</strong> {selectedSolicitud.titulo}</p>
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
                  onChange={e => {
                    setMotivoRechazo(e.target.value)
                    setFormError('')
                  }}
                  rows={4}
                  maxLength={500}
                  aria-invalid={formError ? true : undefined}
                  aria-describedby={formError ? 'motivo-error' : undefined}
                  className="modal-form-field resize-none"
                />
                <div className="mt-1 flex items-center justify-between gap-3">
                  {formError ? (
                    <p
                      id="motivo-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {formError}
                    </p>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <p className="ml-auto text-xs text-muted-foreground">
                    {motivoRechazo.length}/500
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseDecline}
                disabled={isSubmitting}
                className="modal-btn-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={isSubmitting || motivoRechazo.trim().length < 10}
                className="modal-btn-danger"
              >
                {isSubmitting ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </AccessibleDialog>
        )}

      </div>
    </AppLayout>
  )
}
