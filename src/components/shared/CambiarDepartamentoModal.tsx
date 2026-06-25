import { useRef, useState } from 'react'
import { Building2, X } from 'lucide-react'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import useAuthStore from '@/lib/stores/authStore'
import type { Solicitud } from '@/lib/types'
import { useModalAccessibility } from '@/lib/hooks/useModalAccessibility'

interface CambiarDepartamentoModalProps {
  solicitud: Solicitud
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  isFirstAssignment?: boolean
}

export function CambiarDepartamentoModal({
  solicitud,
  open,
  onOpenChange,
  onSuccess,
  isFirstAssignment = false,
}: CambiarDepartamentoModalProps) {
  const { user } = useAuthStore()
  const { getDepartamentosActivos } = useDepartamentosStore()
  const { cambiarDepartamento } = useSolicitudesStore()

  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState(solicitud.departamentoId ?? '')
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const departamentosActivos = getDepartamentosActivos()

  const handleSubmit = async () => {
    if (!user || !selectedDepartamentoId || selectedDepartamentoId === solicitud.departamentoId) return

    setIsSubmitting(true)
    // TODO: Replace with API call PATCH /api/v1/requests/:id/departamento
    await new Promise(resolve => setTimeout(resolve, 500))

    cambiarDepartamento(
      solicitud.id,
      selectedDepartamentoId,
      user.id,
      `${user.nombre} ${user.apellido}`,
      motivo || undefined
    )

    setIsSubmitting(false)
    setMotivo('')
    onOpenChange(false)
    onSuccess?.()
  }

  const handleClose = () => {
    setSelectedDepartamentoId(solicitud.departamentoId ?? '')
    setMotivo('')
    onOpenChange(false)
  }

  useModalAccessibility(open, dialogRef, handleClose)

  if (!open) return null

  return (
    <div
      ref={dialogRef}
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cambiar-depto-title"
    >
      <div className="modal-card max-w-[425px]">
        <div className="modal-header">
          <div>
            <h2
              id="cambiar-depto-title"
              className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground"
            >
              <Building2 className="h-5 w-5 text-primary" />
              {isFirstAssignment ? 'Asignar Departamento' : 'Cambiar Departamento'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFirstAssignment
                ? `Asignar la nota ${solicitud.radicado} a un departamento responsable.`
                : `Reasignar la nota ${solicitud.radicado} a otro departamento.`}
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
            <label className="text-sm text-muted-foreground">Departamento actual</label>
            <div className="modal-info-row">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{solicitud.departamento?.nombre || 'Sin asignar'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="departamento" className="text-sm font-medium text-foreground">
              Nuevo departamento
            </label>
            <select
              id="departamento"
              value={selectedDepartamentoId}
              onChange={(e) => setSelectedDepartamentoId(e.target.value)}
              className="modal-form-field"
            >
              <option value="" disabled>Seleccionar departamento</option>
              {departamentosActivos.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="motivo-depto" className="text-sm font-medium text-foreground">
              Motivo del cambio (opcional)
            </label>
            <textarea
              id="motivo-depto"
              placeholder="Explique brevemente el motivo del cambio de departamento..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={300}
              className="modal-form-field resize-none"
            />
            <p className="text-right text-xs text-muted-foreground">{motivo.length}/300</p>
          </div>
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
            disabled={isSubmitting || !selectedDepartamentoId || selectedDepartamentoId === solicitud.departamentoId}
            className="modal-btn-primary"
          >
            {isSubmitting
              ? 'Guardando...'
              : isFirstAssignment
                ? 'Asignar'
                : 'Confirmar cambio'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CambiarDepartamentoModal
