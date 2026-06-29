import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { 
  Upload, 
  X, 
  FileText, 
  Calendar,
  User,
  CreditCard,
  AlignLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import useAuthStore from '@/lib/stores/authStore'
import useNotificationStore from '@/lib/stores/notificationStore'
import type { SolicitudCategoria, SolicitudFormData, SolicitudPrioridad } from '@/lib/types'
import { PRIORIDAD_LABELS } from '@/lib/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

export default function SubirDocumento() {
  const navigate      = useNavigate()
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const [file, setFile]               = useState<File | null>(null)
  const [fileError, setFileError]     = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newRadicado, setNewRadicado] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const user            = useAuthStore(state => state.user)
  const addSolicitud    = useSolicitudesStore(state => state.addSolicitud)
  const addNotification = useNotificationStore(state => state.addNotification)
  const departamentos   = useDepartamentosStore(state => state.departamentos)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SolicitudFormData>({
    defaultValues: {
      titulo:         '',
      categoria:      '',
      departamentoId: '',
      // Fecha de solicitud por defecto = hoy
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaLimite:    '',
      solicitante:    '',
      identificacion: '',
      descripcion:    '',
      prioridad:      '' as SolicitudPrioridad,
      documento:      null,
    },
  })

  const descripcion = useWatch({ control, name: 'descripcion' }) ?? ''

  // ── File handlers ──────────────────────────────────────────────────────────
  const handleFileSelect = (
    e: ChangeEvent<HTMLInputElement> | { target: { files: File[] | FileList | null } },
  ) => {
    const selectedFile = e.target.files?.[0]
    setFileError(null)
    if (!selectedFile) return

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setFileError('Solo se permiten archivos PDF, JPG o PNG')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError('El archivo no debe superar los 10 MB')
      return
    }
    setFile(selectedFile)
  }

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) handleFileSelect({ target: { files: [droppedFile] } })
  }

  const removeFile = () => {
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: SolicitudFormData) => {
    if (!file) {
      setFileError('Debe adjuntar un documento')
      return
    }
    if (!data.categoria) return

    setIsSubmitting(true)
    setSubmitError(null)

    const fullName = user ? `${user.nombre} ${user.apellido}` : 'Usuario'

    try {
      const solicitud = await addSolicitud({
        titulo:         data.titulo,
        categoria:      data.categoria as SolicitudCategoria,
        departamentoId: data.departamentoId || undefined,
        fechaSolicitud: data.fechaSolicitud,
        fechaLimite:    data.fechaLimite || '',
        solicitante:    data.solicitante,
        identificacion: data.identificacion,
        descripcion:    data.descripcion,
        prioridad:      data.prioridad as SolicitudPrioridad,
        documento:      file,
        subidoPor:      fullName,
        subidoPorId:    user?.id ?? 'system',
      })

      addNotification({
        message: `Nueva solicitud registrada: ${solicitud.radicado}`,
        type: 'success',
      })
      setNewRadicado(solicitud.radicado)
      setShowSuccess(true)
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'No se pudo registrar la solicitud.'
      setSubmitError(message)
      addNotification({ message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewSolicitud = () => {
    reset()
    setFile(null)
    setShowSuccess(false)
    setNewRadicado(null)
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <AppLayout title="Registrar Nueva Solicitud">
        <div className="page-container-sm">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="success-icon-wrapper">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-2 font-serif text-xl font-semibold">
              Solicitud Registrada
            </h2>
            <p className="mb-4 text-muted-foreground">
              La solicitud ha sido registrada exitosamente con el número de radicado:
            </p>
            <p className="mb-6 text-2xl font-bold text-primary">{newRadicado}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleNewSolicitud}
                className="btn-primary w-full py-2.5"
              >
                Registrar otra solicitud
              </button>
              <button
                onClick={() => navigate('/secretaria/seguimiento')}
                className="btn-secondary w-full py-2.5"
              >
                Ver seguimiento
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <AppLayout title="Registrar Nueva Solicitud">
      <div className="page-container-md">
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Registrar Nueva Solicitud
          </h2>
          <p className="text-muted-foreground">
            Complete el formulario para ingresar una nueva solicitud al sistema
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Título */}
            <div>
              <label htmlFor="titulo" className="form-label">
                Título <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <FileText className="form-icon" />
                <input
                  id="titulo"
                  type="text"
                  {...register('titulo', { required: 'El título es requerido' })}
                  placeholder="Título de solicitud..."
                  className="form-input pl-10"
                />
              </div>
              {errors.titulo && (
                <p className="form-error">{errors.titulo.message}</p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="categoria" className="form-label">
                Categoría <span className="text-destructive">*</span>
              </label>
              <select
                id="categoria"
                {...register('categoria', { required: 'La categoría es requerida' })}
                className="form-input custom-select"
              >
                <option value="">Seleccione una categoría</option>
                {(Object.entries(CATEGORIES) as [SolicitudCategoria, typeof CATEGORIES[SolicitudCategoria]][]).map(
                  ([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ),
                )}
              </select>
              {errors.categoria && (
                <p className="form-error">{errors.categoria.message}</p>
              )}
            </div>

            {/* Departamento */}
            <div>
              <label htmlFor="departamentoId" className="form-label">
                Departamento <span className="text-destructive">*</span>
              </label>
              <select
                id="departamentoId"
                {...register('departamentoId', { required: 'El departamento es requerido' })}
                className="form-input custom-select"
              >
                <option value="">Seleccione un departamento</option>
                {departamentos.filter(dep => dep.activo).map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                ))}
              </select>
              {errors.departamentoId && (
                <p className="form-error">{errors.departamentoId.message}</p>
              )}
            </div>

            {/* Prioridad */}
            <div>
              <label htmlFor="prioridad" className="form-label">
                Prioridad <span className="text-destructive">*</span>
              </label>
              <select
                id="prioridad"
                {...register('prioridad', { required: 'La prioridad es requerida' })}
                className="form-input custom-select"
              >
                <option value="">Seleccione una prioridad</option>
                {(Object.entries(PRIORIDAD_LABELS) as [SolicitudPrioridad, string][]).map(
                  ([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ),
                )}
              </select>
              {errors.prioridad && (
                <p className="form-error">{errors.prioridad.message}</p>
              )}
            </div>

            {/* Solicitante */}
            <div>
              <label htmlFor="solicitante" className="form-label">
                Nombre del solicitante <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="form-icon" />
                <input
                  id="solicitante"
                  type="text"
                  {...register('solicitante', { required: 'El nombre es requerido' })}
                  placeholder="Juan Pérez García"
                  className="form-input pl-10"
                />
              </div>
              {errors.solicitante && (
                <p className="form-error">{errors.solicitante.message}</p>
              )}
            </div>

            {/* Identificación */}
            <div>
              <label htmlFor="identificacion" className="form-label">
                Número de identificación
              </label>
              <div className="relative">
                <CreditCard className="form-icon" />
                <input
                  id="identificacion"
                  type="text"
                  {...register('identificacion')}
                  placeholder="12345678"
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Fecha de solicitud — por defecto hoy, editable */}
            <div>
              <label htmlFor="fechaSolicitud" className="form-label">
                Fecha de la solicitud <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar className="form-icon" />
                <input
                  id="fechaSolicitud"
                  type="date"
                  {...register('fechaSolicitud', { required: 'La fecha de solicitud es requerida' })}
                  className="form-input pl-10"
                />
              </div>
              {errors.fechaSolicitud && (
                <p className="form-error">{errors.fechaSolicitud.message}</p>
              )}
            </div>

            {/* Fecha límite — opcional */}
            <div>
              <label htmlFor="fechaLimite" className="form-label">
                Fecha límite{' '}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </label>
              <div className="relative">
                <Calendar className="form-icon" />
                <input
                  id="fechaLimite"
                  type="date"
                  {...register('fechaLimite')}
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="form-label">
                Descripción breve
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  id="descripcion"
                  {...register('descripcion', { maxLength: 300 })}
                  placeholder="Describa brevemente el motivo de la solicitud..."
                  rows={3}
                  maxLength={300}
                  className="form-input resize-none pl-10"
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {descripcion.length}/300 caracteres
              </p>
            </div>

            {/* Documento */}
            <div>
              <label htmlFor="documento" className="form-label">
                Subir documento <span className="text-destructive">*</span>
              </label>
              <input
                id="documento"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="file-preview">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-lg p-2 transition-colors hover:bg-secondary"
                    aria-label="Quitar documento"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    upload-zone w-full
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${fileError
                      ? 'border-destructive bg-destructive/5'
                      : 'border-input hover:border-primary hover:bg-primary/5'}
                  `}
                >
                  <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="mb-1 font-medium text-foreground">
                    Arrastra y suelta tu archivo aquí
                  </p>
                  <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                  <p className="mt-2 text-xs text-muted-foreground">PDF, JPG o PNG (máx. 10 MB)</p>
                </button>
              )}

              {fileError && (
                <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {fileError}
                </p>
              )}
            </div>

            {/* Subido por (solo lectura) */}
            <div>
              <label htmlFor="subidoPor" className="form-label">
                Subido por
              </label>
              <div className="relative">
                <User className="form-icon" />
                <input
                  id="subidoPor"
                  type="text"
                  value={user ? `${user.nombre} ${user.apellido}` : ''}
                  readOnly
                  className="form-input cursor-not-allowed bg-muted pl-10 text-muted-foreground"
                />
              </div>
            </div>

            {/* Botones */}
            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-sm">{submitError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/secretaria')}
                className="btn-secondary flex-1 py-2.5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Registrando...
                  </span>
                ) : (
                  'Registrar solicitud'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AppLayout>
  )
}
