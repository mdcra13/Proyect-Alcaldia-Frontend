import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import useAuthStore from '@/lib/stores/authStore'

interface DeclineModalProps {
  open: boolean
  solicitudId: string
  onClose: () => void
  onDeclined?: () => void
}

export default function DeclineModal({
  open,
  solicitudId,
  onClose,
  onDeclined,
}: DeclineModalProps) {
  const declinar = useSolicitudesStore(state => state.declinar)
  const user = useAuthStore(state => state.user)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const handleClose = () => {
    setMotivo('')
    setError('')
    onClose()
  }

  const handleConfirm = () => {
    const trimmedMotivo = motivo.trim()

    if (!trimmedMotivo) {
      setError('El motivo es obligatorio.')
      return
    }

    if (trimmedMotivo.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres.')
      return
    }

    declinar(
      solicitudId,
      trimmedMotivo,
      user?.id ?? 'system',
      user ? `${user.nombre} ${user.apellido}` : 'Usuario',
    )
    setMotivo('')
    setError('')
    onDeclined?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decline-modal-title"
      aria-describedby="decline-modal-description"
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="decline-modal-title"
                className="font-serif text-xl font-semibold text-foreground"
              >
                Declinar solicitud
              </h2>
              <p
                id="decline-modal-description"
                className="mt-2 text-sm leading-6 text-muted-foreground"
              >
                Ingrese el motivo por el cual esta solicitud será declinada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 p-6">
          <label htmlFor="motivo-rechazo" className="text-sm font-medium text-foreground">
            Motivo
          </label>

          <textarea
            id="motivo-rechazo"
            value={motivo}
            onChange={(event) => {
              setMotivo(event.target.value)
              if (error) setError('')
            }}
            className="min-h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            placeholder="Describa el motivo de la declinación"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'motivo-rechazo-error' : undefined}
          />

          {error && (
            <p id="motivo-rechazo-error" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 font-medium text-foreground transition hover:bg-secondary"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 font-medium text-destructive-foreground transition hover:opacity-90"
          >
            Declinar
          </button>
        </div>
      </div>
    </div>
  )
}
