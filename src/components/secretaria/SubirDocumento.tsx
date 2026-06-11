import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlignLeft,
  CheckCircle,
  Mail,
  Tag,
  User,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import useAuthStore from '@/lib/stores/authStore'
import useNotificationStore from '@/lib/stores/notificationStore'
import {
  createRequest,
  getCategories,
  getDepartments,
} from '@/lib/api'
import type { SolicitudFormData } from '@/lib/types'
import type { ApiCategory, ApiDepartment } from '@/lib/types/api'

export default function SubirDocumento() {
  const navigate = useNavigate()
  const accessToken = useAuthStore(state => state.accessToken)
  const user = useAuthStore(state => state.user)
  const addNotification = useNotificationStore(state => state.addNotification)

  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [departments, setDepartments] = useState<ApiDepartment[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(() =>
    accessToken
      ? null
      : 'La sesion no tiene un token valido. Inicie sesion nuevamente.',
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(
    Boolean(accessToken),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trackingCode, setTrackingCode] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<SolicitudFormData>({
    defaultValues: {
      subject: '',
      categoryId: '',
      departmentId: '',
      applicantName: '',
      applicantContact: '',
      description: '',
      priority: 'Media',
    },
  })

  const categoryId = useWatch({ control, name: 'categoryId' })
  const description = useWatch({ control, name: 'description' }) || ''

  const activeCategories = useMemo(
    () => categories.filter(category => category.isActive),
    [categories],
  )

  const activeDepartments = useMemo(
    () => departments.filter(department => department.isActive),
    [departments],
  )

  useEffect(() => {
    if (!accessToken) {
      return
    }

    let cancelled = false

    Promise.all([
      getCategories(accessToken),
      getDepartments(accessToken),
    ])
      .then(([categoryResponse, departmentResponse]) => {
        if (cancelled) return
        setCategories(categoryResponse)
        setDepartments(departmentResponse)
      })
      .catch(error => {
        if (cancelled) return
        setCatalogError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los catalogos.',
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCatalogs(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    const selectedCategory = categories.find(category => category.id === categoryId)

    if (selectedCategory) {
      setValue('departmentId', selectedCategory.departmentId, {
        shouldValidate: true,
      })
    }
  }, [categories, categoryId, setValue])

  const onSubmit = async (data: SolicitudFormData) => {
    if (!accessToken) {
      setSubmitError('La sesion expiro. Inicie sesion nuevamente.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const request = await createRequest(data, accessToken)
      setTrackingCode(request.trackingCode)
      addNotification({
        message: `Nueva solicitud registrada: ${request.trackingCode}`,
        type: 'success',
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No fue posible registrar la solicitud.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewRequest = () => {
    reset()
    setTrackingCode(null)
    setSubmitError(null)
  }

  if (trackingCode) {
    return (
      <AppLayout title="Registrar Nueva Solicitud">
        <div className="mx-auto mt-12 max-w-md">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-2 font-serif text-xl font-semibold">
              Solicitud registrada
            </h2>
            <p className="mb-4 text-muted-foreground">
              Entregue este codigo al ciudadano para consultar su solicitud:
            </p>
            <p className="mb-6 break-all text-2xl font-bold text-primary">
              {trackingCode}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleNewRequest}
                className="btn-primary w-full py-2.5"
              >
                Registrar otra solicitud
              </button>
              <button
                type="button"
                onClick={() => navigate('/secretaria')}
                className="btn-secondary w-full py-2.5"
              >
                Volver al dashboard
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Registrar Nueva Solicitud">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Registrar solicitud ciudadana
          </h2>
          <p className="text-muted-foreground">
            Complete los datos para generar un codigo de seguimiento.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          {catalogError && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{catalogError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">
                Asunto <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Tag className="form-icon" />
                <input
                  type="text"
                  {...register('subject', { required: 'El asunto es requerido' })}
                  placeholder="Ej. Reparacion de via"
                  className="form-input pl-10"
                />
              </div>
              {errors.subject && (
                <p className="form-error">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Nombre del solicitante <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="form-icon" />
                <input
                  type="text"
                  {...register('applicantName', {
                    required: 'El nombre es requerido',
                  })}
                  placeholder="Nombre completo"
                  className="form-input pl-10"
                />
              </div>
              {errors.applicantName && (
                <p className="form-error">{errors.applicantName.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Contacto del solicitante <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="form-icon" />
                <input
                  type="text"
                  {...register('applicantContact', {
                    required: 'El contacto es requerido',
                  })}
                  placeholder="Correo electronico o telefono"
                  className="form-input pl-10"
                />
              </div>
              {errors.applicantContact && (
                <p className="form-error">{errors.applicantContact.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Categoria <span className="text-destructive">*</span>
              </label>
              <select
                {...register('categoryId', {
                  required: 'La categoria es requerida',
                })}
                disabled={isLoadingCatalogs}
                className="form-input custom-select disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {isLoadingCatalogs
                    ? 'Cargando categorias...'
                    : 'Seleccione una categoria'}
                </option>
                {activeCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="form-error">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Departamento <span className="text-destructive">*</span>
              </label>
              <select
                {...register('departmentId', {
                  required: 'El departamento es requerido',
                })}
                disabled={isLoadingCatalogs}
                className="form-input custom-select disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Seleccione un departamento</option>
                {activeDepartments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="form-error">{errors.departmentId.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Prioridad <span className="text-destructive">*</span>
              </label>
              <select
                {...register('priority', { required: true })}
                className="form-input custom-select"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="form-label">
                Descripcion <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  {...register('description', {
                    required: 'La descripcion es requerida',
                    maxLength: {
                      value: 1000,
                      message: 'La descripcion no puede superar 1000 caracteres',
                    },
                  })}
                  placeholder="Describa la solicitud ciudadana"
                  rows={5}
                  maxLength={1000}
                  className="form-input resize-none pl-10"
                />
              </div>
              <div className="mt-1 flex justify-between gap-4">
                {errors.description ? (
                  <p className="form-error">{errors.description.message}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground">
                  {description.length}/1000
                </p>
              </div>
            </div>

            <div>
              <label className="form-label">Recibido por</label>
              <input
                type="text"
                value={
                  user
                    ? `${user.nombre} ${user.apellido}`
                    : 'Usuario autenticado'
                }
                readOnly
                className="form-input cursor-not-allowed bg-muted text-muted-foreground"
              />
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
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
                disabled={isSubmitting || isLoadingCatalogs || Boolean(catalogError)}
                className="btn-primary flex-1 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Registrando...' : 'Registrar solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
