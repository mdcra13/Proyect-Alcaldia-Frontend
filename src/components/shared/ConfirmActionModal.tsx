import { AlertTriangle, CheckCircle, X } from 'lucide-react'

type ConfirmActionVariant = 'peligro' | 'exito'

interface ConfirmActionModalProps {
  open: boolean
  titulo: string
  mensaje: string
  etiquetaConfirmar: string
  etiquetaCancelar: string
  alConfirmar: () => void
  alCancelar: () => void
  variante?: ConfirmActionVariant
}

export default function ConfirmActionModal({
  open,
  titulo,
  mensaje,
  etiquetaConfirmar,
  etiquetaCancelar,
  alConfirmar,
  alCancelar,
  variante = 'peligro',
}: ConfirmActionModalProps) {
  if (!open) return null

  const isDanger = variante === 'peligro'

  const iconWrapperClass = isDanger
    ? 'bg-destructive/10 text-destructive'
    : 'bg-success/10 text-success'

  const confirmButtonClass = isDanger
    ? 'bg-destructive text-destructive-foreground hover:opacity-90'
    : 'bg-success text-success-foreground hover:opacity-90'

  const Icon = isDanger ? AlertTriangle : CheckCircle

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-title"
      aria-describedby="confirm-action-message"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="flex gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconWrapperClass}`}>
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="confirm-action-title"
                className="font-serif text-xl font-semibold text-foreground"
              >
                {titulo}
              </h2>
              <p
                id="confirm-action-message"
                className="mt-2 text-sm leading-6 text-muted-foreground"
              >
                {mensaje}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={alCancelar}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={alCancelar}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 font-medium text-foreground transition hover:bg-secondary"
          >
            {etiquetaCancelar}
          </button>

          <button
            type="button"
            onClick={alConfirmar}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition ${confirmButtonClass}`}
          >
            {etiquetaConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}