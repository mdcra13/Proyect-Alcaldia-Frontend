import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Building2,
  ChevronRight,
  Settings,
  Shield,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import { ROLE_LABELS } from '@/lib/types'
import type { UserRole } from '@/lib/types'

export default function ITDashboard() {
  const navigate = useNavigate()
  const users = useAuthStore(state => state.users)
  const departamentos = useDepartamentosStore(state => state.departamentos)

  const activeUsers   = users.filter(u => u.status === 'active').length
  const inactiveUsers = users.filter(u => u.status === 'inactive').length
  const activeDepartamentos = departamentos.filter(d => d.activo).length

  const usersByRole: Record<UserRole, number> = {
    alcalde:      users.filter(u => u.role === 'alcalde').length,
    secretaria:   users.filter(u => u.role === 'secretaria').length,
    funcionario:  users.filter(u => u.role === 'funcionario').length,
    departamento: users.filter(u => u.role === 'departamento').length,
    it:           users.filter(u => u.role === 'it').length,
  }

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [users],
  )

  return (
    <AppLayout title="Dashboard IT">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">

        <div>
          <h1 className="dashboard-title">
            Panel de Administración IT
          </h1>
          <p className="dashboard-subtitle mt-1">
            Gestión de usuarios, departamentos y configuración del sistema
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <div className="stat-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="stat-icon">
                <Users className="h-6 w-6" aria-hidden="true" focusable="false" />
              </div>
              <div>
                <p className="stat-value text-2xl">{users.length}</p>
                <p className="stat-label mb-0">Total Usuarios</p>
              </div>
            </div>
          </div>

          {/* Activos */}
          <div className="stat-card stat-card-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="stat-icon stat-icon-green">
                <UserCheck className="h-6 w-6" aria-hidden="true" focusable="false" />
              </div>
              <div>
                <p className="stat-value text-2xl">{activeUsers}</p>
                <p className="stat-label mb-0">Usuarios Activos</p>
              </div>
            </div>
          </div>

          {/* Inactivos */}
          <div className="stat-card stat-card-red transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="stat-icon stat-icon-red">
                <UserX className="h-6 w-6" aria-hidden="true" focusable="false" />
              </div>
              <div>
                <p className="stat-value text-2xl">{inactiveUsers}</p>
                <p className="stat-label mb-0">Usuarios Inactivos</p>
              </div>
            </div>
          </div>

          {/* Departamentos */}
          <div className="stat-card stat-card-amber transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="stat-icon stat-icon-amber">
                <Building2 className="h-6 w-6" aria-hidden="true" focusable="false" />
              </div>
              <div>
                <p className="stat-value text-2xl">{activeDepartamentos}</p>
                <p className="stat-label mb-0">Departamentos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/it/usuarios')}
            className="dashboard-nav-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="dashboard-nav-icon dashboard-nav-icon-primary">
                <Users className="h-6 w-6" aria-hidden="true" focusable="false" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" focusable="false" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Gestión de Usuarios
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crear, editar y administrar usuarios del sistema
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="category-badge border-border">Alcaldes: {usersByRole.alcalde}</span>
              <span className="category-badge border-border">Secretarias: {usersByRole.secretaria}</span>
              <span className="category-badge border-border">Funcionarios: {usersByRole.funcionario}</span>
              <span className="category-badge border-border">Jefes: {usersByRole.departamento}</span>
              <span className="category-badge border-border">IT: {usersByRole.it}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/it/departamentos')}
            className="dashboard-nav-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="dashboard-nav-icon dashboard-nav-icon-amber">
                <Building2 className="h-6 w-6" aria-hidden="true" focusable="false" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" focusable="false" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Gestión de Departamentos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Administrar departamentos y asignar responsables
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              {departamentos.length} departamentos registrados, {activeDepartamentos} activos
            </p>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Usuarios recientes */}
          <section className="rounded-xl border border-border bg-card" aria-labelledby="recent-users-title">
            <div className="border-b border-border p-5">
              <h2 id="recent-users-title" className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
                <Activity className="h-5 w-5 text-primary" aria-hidden="true" focusable="false" />
                Usuarios Recientes
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Últimos usuarios creados en el sistema
              </p>
            </div>
            <div className="p-5">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map(user => (
                    <div
                      key={user.id}
                      className="info-row"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {user.nombre} {user.apellido}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <div className="text-right">
                        <span className={`status-badge border-transparent ${
                          user.status === 'active'
                            ? 'bg-success/10 text-success'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate('/it/usuarios')}
                className="mt-4 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Ver todos los usuarios
              </button>
            </div>
          </section>

          {/* Sistema */}
          <section className="rounded-xl border border-border bg-card" aria-labelledby="system-info-title">
            <div className="border-b border-border p-5">
              <h2 id="system-info-title" className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
                <Shield className="h-5 w-5 text-primary" aria-hidden="true" focusable="false" />
                Información del Sistema
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Estado general de la plataforma</p>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="info-row">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-success" aria-hidden="true" />
                    <span className="text-foreground">Estado del Sistema</span>
                  </div>
                  <span className="status-badge border-transparent bg-success text-success-foreground">
                    Operativo
                  </span>
                </div>
                <div className="info-row">
                  <span className="text-foreground">Versión</span>
                  <span className="font-mono text-sm">v1.0.0</span>
                </div>
                <div className="info-row">
                  <span className="text-foreground">Último backup</span>
                  <span className="text-sm text-muted-foreground">Hace 2 horas</span>
                </div>
                <div className="info-row">
                  <span className="text-foreground">Sesiones activas</span>
                  <span className="status-badge border-transparent bg-secondary text-secondary-foreground">
                    {activeUsers}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground opacity-60"
              >
                <Settings className="h-4 w-4" aria-hidden="true" focusable="false" />
                Configuración Avanzada
              </button>
            </div>
          </section>

        </div>
      </div>
    </AppLayout>
  )
}
