import { X, FileText, CheckCircle, XCircle } from 'lucide-react'
import type { Solicitud } from '@/lib/types'
import useAuthStore from '@/lib/stores/authStore'
import { CATEGORIES } from '@/lib/stores/solicitudesStore'

interface DocumentPreviewModalProps {
  solicitud: Solicitud
  open: boolean
  onClose: () => void
  onApprove?: (id: string) => void
  onDecline?: (id: string) => void
}

export default function DocumentPreviewModal({
  solicitud,
  open,
  onClose,
  onApprove,
  onDecline,
}: DocumentPreviewModalProps) {
  const user = useAuthStore(state => state.user)
  const category = CATEGORIES[solicitud.categoria]
  const canReview = user?.role === 'alcalde'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Vista previa del documento
            </h2>
            <p className="text-sm text-muted-foreground">{solicitud.radicado}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Radicado</p>
              <p className="font-semibold text-foreground">{solicitud.radicado}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p className="font-semibold text-foreground">{solicitud.fechaSolicitud}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Solicitante</p>
              <p className="font-semibold text-foreground">{solicitud.solicitante}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Identificación</p>
              <p className="font-semibold text-foreground">{solicitud.identificacion}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Categoría</p>
              <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${category.color}`}>
                {category.icon} {category.label}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
              <p className="capitalize font-semibold text-foreground">{solicitud.prioridad}</p>
            </div>
          </section>

          <section>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Descripción</p>
            <p className="rounded-md border border-border bg-secondary/50 p-4 text-foreground">
              {solicitud.descripcion}
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold text-foreground">
                Documento adjunto
              </h3>
            </div>

            <div className="rounded-lg border border-border">
              <div className="border-b border-border p-4">
                <p className="font-medium text-foreground">{solicitud.documento}</p>
              </div>

              <div className="flex min-h-80 items-center justify-center bg-secondary/40 p-6">
                <div className="text-center">
                  <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="font-medium text-foreground">Visor PDF</p>
                  <p className="text-sm text-muted-foreground">
                    Aquí se mostrará la vista previa del documento adjunto.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border p-6 sm:flex-row sm:justify-end">
          {canReview && (
            <>
              <button
                type="button"
                onClick={() => onDecline?.(solicitud.id)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive px-4 py-2 font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
              >
                <XCircle className="h-4 w-4" />
                Declinar
              </button>

              <button
                type="button"
                onClick={() => onApprove?.(solicitud.id)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-success px-4 py-2 font-medium text-success-foreground transition hover:opacity-90"
              >
                <CheckCircle className="h-4 w-4" />
                Aprobar
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 font-medium text-foreground transition hover:bg-secondary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
