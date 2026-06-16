import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { CheckCircle, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import AppLayout from '@/components/layout/AppLayout'
import useAuthStore from '@/lib/stores/authStore'
import { ROLE_LABELS } from '@/lib/types'

interface ProfileFormValues {
  nombre: string
  apellido: string
}

export default function PerfilUsuario() {
  const { user, updateUser } = useAuthStore()

  const initials = useMemo(() => {
    const nombre = user?.nombre?.[0] ?? ''
    const apellido = user?.apellido?.[0] ?? ''

    return `${nombre}${apellido}`.toUpperCase()
  }, [user])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!user) return

    reset({
      nombre: user.nombre,
      apellido: user.apellido,
    })
  }, [reset, user])

  const onSaveProfile = (data: ProfileFormValues) => {
    if (!user) return

    updateUser(user.id, {
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
    })

    toast.success('Cambios guardados correctamente')
  }

  if (!user) return null

  return (
    <AppLayout title="Mi perfil">
      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Mi perfil
          </h2>
          <p className="mt-1 text-muted-foreground">
            Actualiza tus datos personales de la cuenta institucional.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex border-b border-border px-4 pt-4 sm:px-6">
            <div className="flex items-center gap-2 border-b-2 border-primary px-4 py-3 text-sm font-medium text-primary">
              <UserRound className="h-4 w-4" />
              Mis datos
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSaveProfile)}
            className="space-y-6 p-4 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-sm">
                {initials}
              </div>

              <div>
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  {user.nombre} {user.apellido}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Información asociada a tu cuenta institucional.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Nombre
                </span>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...register('nombre', {
                    required: 'El nombre es requerido',
                  })}
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">
                    {errors.nombre.message}
                  </p>
                )}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Apellido
                </span>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...register('apellido', {
                    required: 'El apellido es requerido',
                  })}
                />
                {errors.apellido && (
                  <p className="text-sm text-destructive">
                    {errors.apellido.message}
                  </p>
                )}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Username
                </span>
                <input
                  type="text"
                  value={user.username}
                  readOnly
                  className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-muted-foreground"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Rol
                </span>
                <div>
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </div>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">
                  Departamento
                </span>
                <input
                  type="text"
                  value={user.departamento?.nombre ?? '—'}
                  readOnly
                  className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-muted-foreground"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" />
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </section>
    </AppLayout>
  )
}
