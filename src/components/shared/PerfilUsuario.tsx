import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  CheckCircle,
  Clock,
  Laptop,
  Lock,
  Monitor,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import AppLayout from '@/components/layout/AppLayout'
import useAuthStore from '@/lib/stores/authStore'
import { ROLE_LABELS } from '@/lib/types'

type PerfilTab = 'datos' | 'seguridad'
type PasswordStrength = 'debil' | 'media' | 'fuerte' | null

interface ProfileFormValues {
  nombre: string
  apellido: string
}

interface SecurityFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const activeSessions = [
  {
    id: 'session-1',
    device: 'Chrome en Windows',
    activity: 'Activa ahora',
    icon: Monitor,
  },
  {
    id: 'session-2',
    device: 'Safari en iPhone',
    activity: 'Última actividad: hace 2 horas',
    icon: Smartphone,
  },
  {
    id: 'session-3',
    device: 'Edge en portátil institucional',
    activity: 'Última actividad: ayer',
    icon: Laptop,
  },
]

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return null

  const onlyLetters = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/.test(password)
  const hasLetters = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\d]/.test(password)
  const mixedGroups = [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length

  if (password.length < 6 || onlyLetters) return 'debil'
  if (password.length > 8 && hasLetters && hasNumbers && hasSymbols) return 'fuerte'
  if (password.length >= 6 && mixedGroups >= 2) return 'media'

  return 'debil'
}

function getStrengthConfig(strength: PasswordStrength) {
  switch (strength) {
    case 'fuerte':
      return {
        label: 'Fuerte',
        bar: 'bg-success',
        text: 'text-success',
        width: 'w-full',
      }
    case 'media':
      return {
        label: 'Media',
        bar: 'bg-accent',
        text: 'text-accent',
        width: 'w-2/3',
      }
    case 'debil':
      return {
        label: 'Débil',
        bar: 'bg-destructive',
        text: 'text-destructive',
        width: 'w-1/3',
      }
    default:
      return {
        label: 'Sin evaluar',
        bar: 'bg-muted',
        text: 'text-muted-foreground',
        width: 'w-0',
      }
  }
}

export default function PerfilUsuario() {
  const [activeTab, setActiveTab] = useState<PerfilTab>('datos')
  const { user, updateUser } = useAuthStore()

  const initials = useMemo(() => {
    const nombre = user?.nombre?.[0] ?? ''
    const apellido = user?.apellido?.[0] ?? ''

    return `${nombre}${apellido}`.toUpperCase()
  }, [user])

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
    },
    mode: 'onChange',
  })

  const {
    register: registerSecurity,
    handleSubmit: handleSecuritySubmit,
    control: securityControl,
    reset: resetSecurity,
    formState: { errors: securityErrors, isSubmitting: isSecuritySubmitting },
  } = useForm<SecurityFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const newPassword = useWatch({
    control: securityControl,
    name: 'newPassword',
  })
  const confirmPassword = useWatch({
    control: securityControl,
    name: 'confirmPassword',
  })
  const passwordStrength = getPasswordStrength(newPassword)
  const strengthConfig = getStrengthConfig(passwordStrength)
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword

  useEffect(() => {
    if (!user) return

    resetProfile({
      nombre: user.nombre,
      apellido: user.apellido,
    })
  }, [resetProfile, user])

  const onSaveProfile = (data: ProfileFormValues) => {
    if (!user) return

    updateUser(user.id, {
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
    })

    toast.success('Cambios guardados correctamente')
  }

  const onChangePassword = (data: SecurityFormValues) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    resetSecurity()
    toast.success('Contraseña actualizada correctamente')
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
            Actualiza tus datos personales y revisa la seguridad de tu cuenta.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex border-b border-border px-4 pt-4 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveTab('datos')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'datos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserRound className="h-4 w-4" />
              Mis datos
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seguridad')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'seguridad'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="h-4 w-4" />
              Seguridad
            </button>
          </div>

          {activeTab === 'datos' ? (
            <form
              onSubmit={handleProfileSubmit(onSaveProfile)}
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
                    {...registerProfile('nombre', {
                      required: 'El nombre es requerido',
                    })}
                  />
                  {profileErrors.nombre && (
                    <p className="text-sm text-destructive">
                      {profileErrors.nombre.message}
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
                    {...registerProfile('apellido', {
                      required: 'El apellido es requerido',
                    })}
                  />
                  {profileErrors.apellido && (
                    <p className="text-sm text-destructive">
                      {profileErrors.apellido.message}
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
                  disabled={isProfileSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle className="h-4 w-4" />
                  Guardar cambios
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_22rem] sm:p-6">
              <form
                onSubmit={handleSecuritySubmit(onChangePassword)}
                className="space-y-5"
              >
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    Cambiar contraseña
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Usa una contraseña con letras, números y símbolos.
                  </p>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Contraseña actual
                  </span>
                  <input
                    type="password"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    {...registerSecurity('currentPassword', {
                      required: 'La contraseña actual es requerida',
                    })}
                  />
                  {securityErrors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {securityErrors.currentPassword.message}
                    </p>
                  )}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Nueva contraseña
                  </span>
                  <input
                    type="password"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    {...registerSecurity('newPassword', {
                      required: 'La nueva contraseña es requerida',
                    })}
                  />

                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full transition-all ${strengthConfig.bar} ${strengthConfig.width}`}
                      />
                    </div>
                    <p className={`text-sm font-medium ${strengthConfig.text}`}>
                      Fortaleza: {strengthConfig.label}
                    </p>
                  </div>

                  {securityErrors.newPassword && (
                    <p className="text-sm text-destructive">
                      {securityErrors.newPassword.message}
                    </p>
                  )}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Confirmar nueva contraseña
                  </span>
                  <input
                    type="password"
                    className={`w-full rounded-md border bg-background px-3 py-2 text-foreground outline-none transition-colors focus:ring-2 ${
                      passwordsMatch
                        ? 'border-input focus:border-primary focus:ring-primary/20'
                        : 'border-destructive focus:border-destructive focus:ring-destructive/20'
                    }`}
                    {...registerSecurity('confirmPassword', {
                      required: 'Confirma la nueva contraseña',
                    })}
                  />
                  {!passwordsMatch && (
                    <p className="text-sm text-destructive">
                      Las contraseñas no coinciden
                    </p>
                  )}
                  {securityErrors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {securityErrors.confirmPassword.message}
                    </p>
                  )}
                </label>

                <button
                  type="submit"
                  disabled={isSecuritySubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Cambiar contraseña
                </button>
              </form>

              <aside className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="mb-4">
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Sesiones activas
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dispositivos con acceso reciente a tu cuenta.
                  </p>
                </div>

                <div className="space-y-3">
                  {activeSessions.map((session) => {
                    const Icon = session.icon

                    return (
                      <div
                        key={session.id}
                        className="flex items-start gap-3 rounded-md border border-border bg-card p-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>

                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.device}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {session.activity}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  )
}
