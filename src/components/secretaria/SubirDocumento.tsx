import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { 
  Upload, 
  X, 
  FileText, 
  Calendar,
  User,
  CreditCard,
  AlignLeft,
  CheckCircle
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import useSolicitudesStore, { CATEGORIES } from '@/lib/stores/solicitudesStore'
import { mockDepartamentos } from '@/lib/stores/departamentosStore'
import useAuthStore from '@/lib/stores/authStore'
import useNotificationStore from '@/lib/stores/notificationStore'
import type { SolicitudCategoria, SolicitudFormData } from '@/lib/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export default function SubirDocumento() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newRadicado, setNewRadicado] = useState<string | null>(null)
  
  const user = useAuthStore(state => state.user)
  const addSolicitud = useSolicitudesStore(state => state.addSolicitud)
  const addNotification = useNotificationStore(state => state.addNotification)
  
  const {
  register,
  handleSubmit,
  watch,
  formState: { errors },
  reset,
} = useForm<SolicitudFormData>({
  defaultValues: {
    titulo: '',
    categoria: '',
    departamentoId: '',
    fechaLimite: '',
    solicitante: '',
    identificacion: '',
    descripcion: '',
    documento: null,
  },
})
  
  const descripcion = watch('descripcion', '')
  
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement> | { target: { files: File[] | FileList | null } }) => {
    const selectedFile = e.target.files?.[0]
    setFileError(null)
    
    if (!selectedFile) return
    
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setFileError('Solo se permiten archivos PDF, JPG o PNG')
      return
    }
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError('El archivo no debe superar los 10MB')
      return
    }
    
    setFile(selectedFile)
  }
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect({ target: { files: [droppedFile] } })
    }
  }
  
  const removeFile = () => {
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const onSubmit = async (data: SolicitudFormData) => {
  if (!file) {
    setFileError('Debe adjuntar un documento')
    return
  }

  if (!data.categoria) {
    return
  }

  setIsSubmitting(true)

  await new Promise(resolve => setTimeout(resolve, 1000))

  const fullName = user
    ? `${user.nombre} ${user.apellido}`
    : 'Usuario'

  const solicitud = addSolicitud({
    titulo: data.titulo,
    categoria: data.categoria as SolicitudCategoria,
    departamentoId: data.departamentoId || undefined,
    fechaLimite: data.fechaLimite,
    solicitante: data.solicitante,
    identificacion: data.identificacion,
    descripcion: data.descripcion,
    documento: file.name,
    subidoPor: fullName,
    subidoPorId: user?.id ?? 'system',
  })

  addNotification({
    message: `Nueva solicitud registrada: ${solicitud.radicado}`,
    type: 'success',
  })

  setNewRadicado(solicitud.radicado)
  setShowSuccess(true)
  setIsSubmitting(false)
}
  
  const handleNewSolicitud = () => {
    reset()
    setFile(null)
    setShowSuccess(false)
    setNewRadicado(null)
  }
  
  if (showSuccess) {
    return (
      <AppLayout title="Registrar Nueva Solicitud">
        <div className="max-w-md mx-auto mt-12">
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-serif font-semibold mb-2">
              Solicitud Registrada
            </h2>
            <p className="text-muted-foreground mb-4">
              La solicitud ha sido registrada exitosamente con el número de radicado:
            </p>
            <p className="text-2xl font-bold text-primary mb-6">{newRadicado}</p>
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
  
  return (
    <AppLayout title="Registrar Nueva Solicitud">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Registrar Nueva Solicitud
          </h2>
          <p className="text-muted-foreground">
            Complete el formulario para ingresar una nueva solicitud al sistema
          </p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Categoría */}
            {/* Título de la petición */}
            <div>
              <label htmlFor="titulo" className="form-label">
                Título<span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="form-icon" />
                <input
                  id="titulo"
                  type="text"
                  {...register('titulo', { required: 'El título es requerido' })}
                  placeholder="Título de solicitud..."
                  className="form-input pl-10"
                />
              </div>
            </div>
            {/*Categoría*/}
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
                {(Object.entries(CATEGORIES) as [SolicitudCategoria, typeof CATEGORIES[SolicitudCategoria]][]).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              {errors.categoria && (
                <p className="form-error">{errors.categoria.message}</p>
              )}
            </div>
            {/* Nombre del solicitante */}
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
            {/* Fecha de solicitud */}
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
                  className="form-input pl-10 resize-none"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {descripcion.length}/300 caracteres
              </p>
            </div>
            {/* File upload */}
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
              
              {!file ? (
                <div
                    role="button"
                    tabIndex={0}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary
                      ${fileError ? 'border-destructive bg-destructive/5' : 'border-input hover:border-primary hover:bg-primary/5'}
                    `}
                  >
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground mb-1">
                    Arrastra y suelta tu archivo aquí
                  </p>
                  <p className="text-sm text-muted-foreground">
                    o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, JPG o PNG (máx. 10MB)
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    aria-label="Quitar documento"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              {fileError && (
                <p className="mt-1 text-sm text-destructive">{fileError}</p>
              )}
            </div>
            {/* Fecha límite */}
            <div>
              <label htmlFor="fechaLimite" className="form-label">
                Fecha límite<span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar className="form-icon" />
                <input
                  id="fechaLimite"
                  type="date"
                  {...register('fechaLimite', { required: 'La fecha límite es requerida, introducir N/A si no tiene.' })}
                  className="form-input pl-10"
                />
              </div>
              {errors.fechaSolicitud && (
                <p className="form-error">{errors.fechaSolicitud.message}</p>
              )}
            </div>
            {/* Subido por */}
            <div>
              <label htmlFor="subidoPor" className="form-label">
                Subido por
              </label>
              <input
                id="subidoPor"
                type="text"
                value={user?.nombre || ''}
                readOnly
                className="form-input bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            {/*Departamento*/}
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
                {mockDepartamentos.map(departamento => (
                  <option key={departamento.id} value={departamento.id}>
                    {departamento.nombre}
                  </option>
                ))}
              </select>
              {errors.departamentoId && (
                <p className="form-error">{errors.departamentoId.message}</p>
              )}
            </div>
            {/* Buttons */}
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
                className="btn-primary flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
