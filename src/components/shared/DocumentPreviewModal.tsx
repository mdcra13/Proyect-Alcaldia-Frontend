import {
  Calendar,
  CheckCircle,
  Download,
  FileText,
  History,
  Landmark,
  PenLine,
  Tag,
  Undo2,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DocumentoVersion, Solicitud } from '@/lib/types'
import { ESTADO_CONFIG, PRIORIDAD_LABELS } from '@/lib/types'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import EstadoBadge from '@/components/shared/EstadoBadge'
import FechaLimiteBadge from '@/components/shared/FechaLimiteBadge'
import { decodeText, normalizeDepartamentoNombre } from '@/lib/utils'
import { useModalAccessibility } from '@/lib/hooks/useModalAccessibility'
import HistorialTimeline from '@/components/shared/HistorialTimeline'

interface DocumentPreviewModalProps {
  solicitud: Solicitud
  open: boolean
  onClose: () => void
  onApprove?: () => void
  onDecline?: () => void
  onRequestChanges?: () => void
  approveLabel?: string
}

export default function DocumentPreviewModal({
  solicitud: initialSolicitud,
  open,
  onClose,
  onApprove,
  onDecline,
  onRequestChanges,
  approveLabel,
}: DocumentPreviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [solicitud, setSolicitud] = useState(initialSolicitud)
  const [selectedDocument, setSelectedDocument] = useState<DocumentoVersion | null>(null)
  const user      = useAuthStore(state => state.user)
  const registrarVista = useSolicitudesStore(state => state.registrarVista)
  const loadSolicitudDetails = useSolicitudesStore(state => state.loadSolicitudDetails)
  const category  = CATEGORIES[solicitud.categoria]
  const status    = ESTADO_CONFIG[solicitud.estado]
  const displayedDocumentName = selectedDocument?.nombre ?? solicitud.documento
  const displayedDocumentUrl = selectedDocument?.url ?? solicitud.documentoUrl
  const isImageDocument = /\.(?:jpe?g|png|webp)(?:$|\?)/i.test(
    displayedDocumentUrl ?? displayedDocumentName ?? '',
  )
  const titleId       = `document-preview-title-${solicitud.id}`
  const descriptionId = `document-preview-description-${solicitud.id}`

  const isMayorReview =
    user?.role === 'alcalde' &&
    ['approved_by_department', 'awaiting_mayor_signature'].includes(solicitud.estado)
  const canReview =
    (isMayorReview ||
    (user?.role === 'departamento' && ['assigned_to_department', 'in_review', 'returned_to_department'].includes(solicitud.estado))) &&
    Boolean(onApprove || onDecline || onRequestChanges)

  useModalAccessibility(open, dialogRef, onClose)

  useEffect(() => {
    setSolicitud(initialSolicitud)
    setSelectedDocument(null)
  }, [initialSolicitud])

  useEffect(() => {
    if (!open) return
    let active = true

    void loadSolicitudDetails(initialSolicitud.id)
      .then(details => {
        if (active) {
          setSolicitud(details)
          setSelectedDocument(
            details.documentos?.find(document => document.esActual) ??
            details.documentos?.[0] ??
            null,
          )
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [initialSolicitud.id, loadSolicitudDetails, open])

  useEffect(() => {
    if (!open || !user) return

    registrarVista(
      solicitud.id,
      user.id,
      `${user.nombre} ${user.apellido}`,
    )
  }, [open, registrarVista, solicitud.id, user])

  if (!open) return null

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2 id={titleId} className="font-serif text-2xl font-semibold text-foreground">
              Vista previa del documento
            </h2>
            <p id={descriptionId} className="text-sm text-muted-foreground">
              {solicitud.radicado} · {status.label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar vista previa"
          >
            <X className="h-5 w-5" aria-hidden="true" focusable="false" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto">
          <div className="space-y-6 p-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Código de seguimiento</p>
                <p className="font-semibold text-foreground">{solicitud.radicado}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <EstadoBadge estado={solicitud.estado} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Identificador</p>
                <p className="font-semibold text-foreground">{solicitud.titulo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de solicitud</p>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" focusable="false" />
                  {solicitud.fechaSolicitud}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subido por</p>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" focusable="false" />
                  {solicitud.subidoPor === 'Backend' ? decodeText(solicitud.solicitante) : decodeText(solicitud.subidoPor)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solicitante</p>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" focusable="false" />
                  {decodeText(solicitud.solicitante)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Identificación</p>
                <p className="font-semibold text-foreground">{decodeText(solicitud.identificacion) || 'No especificada'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
                  category?.color ?? 'border-border bg-muted text-muted-foreground'
                }`}>
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" focusable="false" />
                  {category?.icon} {category?.label ?? decodeText(solicitud.categoria)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
                <p className="font-semibold text-foreground">{PRIORIDAD_LABELS[solicitud.prioridad]}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Landmark className="h-4 w-4 text-muted-foreground" aria-hidden="true" focusable="false" />
                  {normalizeDepartamentoNombre(solicitud.departamento?.nombre) ?? 'Sin asignar'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha límite</p>
                <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
              </div>
            </section>

            <section>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="rounded-lg border border-border bg-secondary/50 p-4 text-foreground">
                {solicitud.descripcion || 'Sin descripción'}
              </p>
            </section>

            {solicitud.motivoRechazo && (
              <section>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Motivo / observación</p>
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  {solicitud.motivoRechazo}
                </p>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" focusable="false" />
                <h3 className="font-serif text-lg font-semibold text-foreground">Documento adjunto</h3>
              </div>
              <div className="rounded-lg border border-border">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <p className="font-medium text-foreground">
                    {displayedDocumentName ?? 'Sin documento adjunto'}
                  </p>
                  {displayedDocumentName && (
                    <a  
                      href={displayedDocumentUrl ?? '#'}
                      download={displayedDocumentName}
                      onClick={e => { if (!displayedDocumentUrl) e.preventDefault() }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
                      aria-label={`Descargar ${displayedDocumentName}`}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Descargar
                    </a>
                  )}
                </div>
                <div className="flex min-h-80 items-center justify-center bg-secondary/40 p-2">
                  {displayedDocumentUrl && isImageDocument ? (
                    <img
                      src={displayedDocumentUrl}
                      alt={`Vista previa de ${displayedDocumentName ?? 'la imagen adjunta'}`}
                      className="max-h-[65vh] w-full rounded-md object-contain"
                    />
                  ) : displayedDocumentUrl ? (
                    <embed
                      src={displayedDocumentUrl}
                      type="application/pdf"
                      className="h-full w-full min-h-[300px] rounded-md"
                      aria-label="Vista previa del documento PDF"
                    />
                  ) : (
                    <div className="text-center py-16">
                      <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" aria-hidden="true" focusable="false" />
                      <p className="font-medium text-foreground">Visor PDF</p>
                      <p className="text-sm text-muted-foreground">
                        No hay documento adjunto disponible para visualizar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="font-serif text-lg font-semibold text-foreground">Versiones del expediente</h3>
              </div>
              {solicitud.documentos?.length ? (
                <div className="space-y-2">
                  {solicitud.documentos.map(document => (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => setSelectedDocument(document)}
                      className={`flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition sm:flex-row sm:items-center sm:justify-between ${
                        selectedDocument?.id === document.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-secondary/60'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                          Versión {document.version}: {document.nombre}
                          {document.esActual && (
                            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">Actual</span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Subida por {document.subidoPor} · {new Date(document.fecha).toLocaleString('es-CO')} · {(document.tamano / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-medium text-primary">Ver versión</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No hay versiones registradas.</p>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="font-serif text-lg font-semibold text-foreground">Actividad de la solicitud</h3>
              </div>
              <HistorialTimeline historial={solicitud.historial} />
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-border p-6 sm:flex-row sm:justify-end">
          {canReview && (
            isMayorReview ? (
              <>
                <button
                  type="button"
                  onClick={() => onDecline?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-2 font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
                >
                  <XCircle className="h-4 w-4" aria-hidden="true" focusable="false" />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => onRequestChanges?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 font-medium text-amber-800 transition hover:bg-amber-100"
                >
                  <Undo2 className="h-4 w-4" aria-hidden="true" focusable="false" />
                  Solicitar cambios
                </button>
                <button
                  type="button"
                  onClick={() => onApprove?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 font-medium text-success-foreground transition hover:opacity-90"
                >
                  {solicitud.estado === 'awaiting_mayor_signature' ? (
                    <PenLine className="h-4 w-4" aria-hidden="true" focusable="false" />
                  ) : (
                    <CheckCircle className="h-4 w-4" aria-hidden="true" focusable="false" />
                  )}
                  {approveLabel ?? (solicitud.estado === 'awaiting_mayor_signature' ? 'Firmar' : 'Aprobar')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onDecline?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive px-4 py-2 font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
                >
                  <XCircle className="h-4 w-4" aria-hidden="true" focusable="false" />
                  Declinar
                </button>
                <button
                  type="button"
                  onClick={() => onApprove?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 font-medium text-success-foreground transition hover:opacity-90"
                >
                  <CheckCircle className="h-4 w-4" aria-hidden="true" focusable="false" />
                  {approveLabel ?? 'Aprobar'}
                </button>
              </>
            )
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
