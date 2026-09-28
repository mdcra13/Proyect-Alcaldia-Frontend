import { useState, useEffect, useRef } from 'react'
import { RefreshCw, PenLine, CornerDownLeft, XCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import useAuthStore from '@/lib/stores/authStore'
import type { Solicitud, SolicitudEstado } from '@/lib/types'
import { ESTADO_TRANSITIONS_DEPARTAMENTO, ESTADO_TRANSITIONS_ALCALDE, ESTADO_CONFIG } from '@/lib/types'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { useModalAccessibility } from '@/lib/hooks/useModalAccessibility'

interface CambiarEstadoModalProps {
  solicitud: Solicitud
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  presetEstado?: SolicitudEstado
}

const ESTADOS_CON_MOTIVO: SolicitudEstado[] = [
  'rejected_by_department',
  'rejected_by_mayor_office',
  'returned_to_department',
]

const MOTIVO_MIN_LENGTH = 10

function getValidTransitions(estado: SolicitudEstado, role?: string): SolicitudEstado[] {
  if (role === 'alcalde') return ESTADO_TRANSITIONS_ALCALDE[estado] ?? []
  return ESTADO_TRANSITIONS_DEPARTAMENTO[estado] ?? []
}

function getHeaderConfig(estado: SolicitudEstado | '') {
  if (estado === 'signed') return { icon: PenLine, label: 'Firmar Solicitud', color: 'text-success' }
  if (estado === 'returned_to_department') return { icon: CornerDownLeft, label: 'Solicitar cambios al departamento', color: 'text-warning' }
  if (estado === 'rejected_by_mayor_office' || estado === 'rejected_by_department') return { icon: XCircle, label: 'Rechazar Solicitud', color: 'text-destructive' }
  return { icon: RefreshCw, label: 'Cambiar Estado', color: 'text-primary' }
}

export function CambiarEstadoModal({
  solicitud,
  open,
  onOpenChange,
  onSuccess,
  presetEstado,
}: CambiarEstadoModalProps) {
  const { user } = useAuthStore()
  const { cambiarEstado } = useSolicitudesStore()

  const [selectedEstado, setSelectedEstado] = useState<SolicitudEstado | ''>('')
  const [observacion, setObservacion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && presetEstado) {
      // Sincroniza el valor al abrir el modal con una accion preseleccionada.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedEstado(presetEstado)
    }
  }, [open, presetEstado])

  const validTransitions = getValidTransitions(solicitud.estado, user?.role)

  const isSign = selectedEstado === 'signed'
  const isReject = selectedEstado === 'rejected_by_mayor_office' || selectedEstado === 'rejected_by_department'
  const isRequestChanges = selectedEstado === 'returned_to_department'
  const isMotivoRequired = !!selectedEstado && ESTADOS_CON_MOTIVO.includes(selectedEstado as SolicitudEstado)
  const motivoTooShort = observacion.trim().length < MOTIVO_MIN_LENGTH
  const isValid = !!selectedEstado && (!isMotivoRequired || !motivoTooShort)

  const resetState = () => {
    setSelectedEstado(presetEstado ?? '')
    setObservacion('')
  }

  const handleSubmit = async () => {
    if (!user || !selectedEstado || !isValid) return

    setIsSubmitting(true)
    try {
      await cambiarEstado(
        solicitud.id,
        selectedEstado,
        user.id,
        `${user.nombre} ${user.apellido}`,
        observacion || undefined
      )
      resetState()
      onOpenChange(false)
      onSuccess?.()
      toast.success('Estado actualizado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  useModalAccessibility(open, dialogRef, handleClose)

  const headerConfig = getHeaderConfig(selectedEstado)
  const HeaderIcon = headerConfig.icon

  const isPreset = !!presetEstado
  const noTransitions = !isPreset && validTransitions.length === 0
  const isSubmitDisabled = isSubmitting || !isValid || noTransitions

  if (!open) return null

  return (
    <div
      ref={dialogRef}
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cambiar-estado-title"
    >
      <div className="modal-card max-w-[425px]">
        <div className="modal-header">
          <div>
            <h2
              id="cambiar-estado-title"
              className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground"
            >
              <HeaderIcon className={`h-5 w-5 ${headerConfig.color}`} />
              {headerConfig.label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Actualizar el estado de la nota {solicitud.radicado}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Estado actual</label>
            <div className="modal-info-row">
              <EstadoBadge estado={solicitud.estado} />
            </div>
          </div>

          {noTransitions ? (
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              No hay transiciones disponibles para el estado actual.
            </div>
          ) : (
            <>
              {!isPreset && (
                <div className="space-y-2">
                  <label htmlFor="nuevo-estado" className="text-sm font-medium text-foreground">
                    Nuevo estado
                  </label>
                  <select
                    id="nuevo-estado"
                    value={selectedEstado}
                    onChange={(e) => setSelectedEstado(e.target.value as SolicitudEstado)}
                    className="modal-form-field"
                  >
                    <option value="" disabled>Seleccionar estado</option>
                    {validTransitions.map((estado) => (
                      <option key={estado} value={estado}>
                        {ESTADO_CONFIG[estado].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isPreset && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Nuevo estado</label>
                  <div className="modal-info-row">
                    {selectedEstado && <EstadoBadge estado={selectedEstado as SolicitudEstado} />}
                  </div>
                </div>
              )}

              {isSign && (
                <div className="firma-confirmacion">
                  ¿Confirmas la firma lógica de esta solicitud? Esta acción queda registrada en el historial.
                </div>
              )}

              {!isSign && selectedEstado && (
                <div className="space-y-2">
                  <label htmlFor="observacion" className="text-sm font-medium text-foreground">
                    {isMotivoRequired ? 'Motivo *' : 'Observación (opcional)'}
                  </label>
                  <textarea
                    id="observacion"
                    placeholder={
                      isMotivoRequired
                        ? 'Explique el motivo (mínimo 10 caracteres)...'
                        : 'Agregue una observación si lo desea...'
                    }
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className={`modal-form-field resize-none${isMotivoRequired && motivoTooShort ? ' border-destructive' : ''}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {isMotivoRequired && motivoTooShort && (
                      <span className="text-destructive">Mínimo {MOTIVO_MIN_LENGTH} caracteres</span>
                    )}
                    <span className="ml-auto">{observacion.length}/500</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="modal-btn-cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={isSign ? 'modal-btn-success' : isReject ? 'modal-btn-danger' : 'modal-btn-primary'}
          >
            {isSubmitting
              ? 'Guardando...'
              : isSign
                ? 'Firmar solicitud'
                : isReject
                  ? 'Rechazar definitivamente'
                  : isRequestChanges
                    ? 'Enviar solicitud de cambios'
                    : 'Confirmar cambio'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CambiarEstadoModal
