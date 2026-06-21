import {
  Calendar,
  CheckCircle,
  FileText,
  Landmark,
  Tag,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { useRef } from 'react'
import type { Solicitud } from '@/lib/types'
import { ESTADO_CONFIG, PRIORIDAD_LABELS } from '@/lib/types'
import useAuthStore from '@/lib/stores/authStore'
import { CATEGORIES } from '@/lib/stores/solicitudesStore'
import EstadoBadge from '@/components/shared/EstadoBadge'
import FechaLimiteBadge from '@/components/shared/FechaLimiteBadge'
import { useModalAccessibility } from '@/lib/hooks/useModalAccessibility'

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
  const dialogRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore(state => state.user)
  const category = CATEGORIES[solicitud.categoria]
  const status = ESTADO_CONFIG[solicitud.estado]

  const canReview =
  ((user?.role === 'alcalde' && solicitud.estado === 'awaiting_mayor_signature') ||
   (user?.role === 'departamento' && ['assigned_to_department', 'in_review', 'returned_to_department'].includes(solicitud.estado))) &&
  Boolean(onApprove || onDecline)

  useModalAccessibility(open, dialogRef, onClose)

  if (!open) return null

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-title"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2
              id="document-preview-title"
              className="font-serif text-2xl font-semibold text-foreground"
            >
              Vista previa del documento
            </h2>
            <p className="text-sm text-muted-foreground">
              {solicitud.radicado} · {status.label}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-button text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar vista previa"
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
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <EstadoBadge estado={solicitud.estado} />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Título</p>
              <p className="font-semibold text-foreground">{solicitud.titulo}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Fecha de solicitud
              </p>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {solicitud.fechaSolicitud}
              </div>
            </div>

            <div>
            <p className="text-sm font-medium text-muted-foreground">Subido por</p>
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              {solicitud.subidoPor}
            </div>
          </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Solicitante</p>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                {solicitud.solicitante}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Identificación
              </p>
              <p className="font-semibold text-foreground">
                {solicitud.identificacion}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Categoría</p>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
                  category?.color ?? 'border-border bg-muted text-muted-foreground'
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                {category?.icon} {category?.label ?? solicitud.categoria}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
              <p className="font-semibold text-foreground">
                {PRIORIDAD_LABELS[solicitud.prioridad]}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Departamento</p>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                {solicitud.departamento?.nombre ?? 'Sin asignar'}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha límite</p>
              <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
            </div>
          </section>

          <section>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Descripción
            </p>
            <p className="rounded-lg border border-border bg-secondary/50 p-4 text-foreground">
              {solicitud.descripcion}
            </p>
          </section>

          {solicitud.motivoRechazo && (
            <section>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Motivo / observación
              </p>
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {solicitud.motivoRechazo}
              </p>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold text-foreground">
                Documento adjunto
              </h3>
            </div>

            <div className="rounded-lg border border-border">
              <div className="border-b border-border p-4">
                <p className="font-medium text-foreground">
                  {solicitud.documento ?? 'Sin documento adjunto'}
                </p>
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
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-2 font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
              >
                <XCircle className="h-4 w-4" />
                Declinar
              </button>

              <button
                type="button"
                onClick={() => onApprove?.(solicitud.id)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 font-medium text-success-foreground transition hover:opacity-90"
              >
                <CheckCircle className="h-4 w-4" />
                Aprobar
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 font-medium text-foreground transition hover:bg-secondary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
