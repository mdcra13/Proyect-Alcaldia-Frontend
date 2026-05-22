import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle, Eye, EyeOff, Lock, User } from 'lucide-react'
import useAuthStore from '@/lib/stores/authStore'
import type { LoginFormData } from '@/lib/types'

export default function LoginPage() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] =
    useState(false)

  const [loginError, setLoginError] =
    useState<string | null>(null)

  const [isLoading, setIsLoading] =
    useState(false)

  const login = useAuthStore(
    (state) => state.login
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      username: '',
      password: '',
      remember: false,
    },
  })

  const onSubmit = async (
    data: LoginFormData
  ) => {
    setIsLoading(true)

    setLoginError(null)

    await new Promise((resolve) =>
      setTimeout(resolve, 800)
    )

    const result = login(
      data.username,
      data.password,
      data.remember
    )

    if (result.success) {
      navigate('/')
    } else {
      setLoginError(
        result.error ||
          'Error al iniciar sesión'
      )
    }

    setIsLoading(false)
  }

  return (
    <div className="login-wrapper bg-institutional-texture">
      <div className="w-full max-w-md">
        <div className="login-card">
          <div className="mb-6 flex justify-center">
            <img
              src="/logo-alcaldia.jpg"
              alt="Logo Alcaldía"
              className="h-27.5 w-auto object-contain"
            />
          </div>

          <h1 className="mb-1 text-center text-2xl font-bold text-primary">
            Sistema de Ayuda Social
          </h1>

          <p className="mb-8 text-center text-muted-foreground">
            Alcaldía Municipal
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="username"
                className="sr-only"
              >
                Usuario
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="username"
                  type="text"
                  placeholder="Usuario"
                  className="w-full rounded-lg border border-input bg-secondary/50 py-3 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('username', {
                    required:
                      'El usuario es requerido',
                  })}
                />
              </div>

              {errors.username && (
                <p className="mt-1 text-sm text-destructive">
                  {
                    errors.username
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="sr-only"
              >
                Contraseña
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Contraseña"
                  className="w-full rounded-lg border border-input bg-secondary/50 py-3 pl-10 pr-12 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('password', {
                    required:
                      'La contraseña es requerida',
                  })}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={
                    showPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-sm text-destructive">
                  {
                    errors.password
                      .message
                  }
                </p>
              )}
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />

                <p className="text-sm">
                  {loginError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>

                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-center text-xs text-muted-foreground">
              Alcaldía de Santiago de Veraguas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}