import { useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Edit2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { User, UserRole } from '@/lib/types'
import UserFormModal, { type UserFormData, } from './UserFormModal'

const ITEMS_PER_PAGE = 10

const ROLE_LABELS: Record<UserRole, string> = {
  secretaria: 'Secretaria',
  departamento: 'Jefe de Departamento',
  alcalde: 'Alcalde',
  it: 'Operador IT',
}

const ROLE_COLORS: Record<UserRole, string> = {
  secretaria: 'border-blue-200 bg-blue-100 text-blue-800',
  departamento: 'border-purple-200 bg-purple-100 text-purple-800',
  alcalde: 'border-amber-200 bg-amber-100 text-amber-800',
  it: 'border-green-200 bg-green-100 text-green-800',
}

const initialFormData: UserFormData = {
  nombre: '',
  apellido: '',
  username: '',
  role: '',
  departamentoId: '',
}

export default function ITGestionUsuarios() {
  const { users, addUser, updateUser, toggleUserStatus } = useAuthStore()
  const departamentos = useDepartamentosStore(state => state.departamentos)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos')
  const [currentPage, setCurrentPage] = useState(1)

  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')

  const filteredUsers = useMemo(() => {
    let results = [...users]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()

      results = results.filter(user =>
        user.nombre.toLowerCase().includes(query) ||
        user.apellido.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      )
    }

    if (filterRole !== 'todos') {
      results = results.filter(user => user.role === filterRole)
    }

    return results.sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [users, searchQuery, filterRole])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  )

  const stats = useMemo(
    () => ({
      total: users.length,
      activos: users.filter(user => user.status === 'active').length,
      inactivos: users.filter(user => user.status !== 'active').length,
    }),
    [users]
  )

  const getDepartamentoNombre = (departamentoId?: string) => {
    if (!departamentoId) return '-'

    const departamento = departamentos.find(item => item.id === departamentoId)

    return departamento?.nombre ?? '-'
  }

  const handleAddUser = () => {
    setFormData(initialFormData)
    setFormError('')
    setIsEditing(false)
    setSelectedUser(null)
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setFormData({
      nombre: user.nombre,
      apellido: user.apellido,
      username: user.username,
      role: user.role,
      departamentoId: user.departamentoId || '',
    })
    setFormError('')
    setIsEditing(true)
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleToggleStatus = (user: User) => {
    toggleUserStatus(user.id)
  }

  const handleSubmit = () => {
    if (
      !formData.nombre.trim() ||
      !formData.apellido.trim() ||
      !formData.username.trim() ||
      !formData.role
    ) {
      setFormError('Completa todos los campos obligatorios.')
      return
    }

    if (formData.role === 'departamento' && !formData.departamentoId) {
      setFormError('Selecciona el departamento del usuario.')
      return
    }

    const departamentoId =
      formData.role === 'departamento' ? formData.departamentoId : undefined

    if (isEditing && selectedUser) {
      updateUser(selectedUser.id, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        username: formData.username,
        role: formData.role,
        departamentoId,
      })
    } else {
      addUser({
        nombre: formData.nombre,
        apellido: formData.apellido,
        username: formData.username,
        role: formData.role,
        departamentoId,
        status: 'active',
      })
    }

    setShowUserModal(false)
    setFormData(initialFormData)
    setFormError('')
  }

  return (
    <AppLayout title="Gestión de Usuarios">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h1 className="font-serif text-2xl font-bold text-primary">
                Gestión de Usuarios
              </h1>
              <p className="text-muted-foreground">
                Administra los usuarios del sistema
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddUser}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Usuarios</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.activos}
                </p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <UserX className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.inactivos}
                </p>
                <p className="text-xs text-muted-foreground">Inactivos</p>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="users-search" className="sr-only">
                Buscar usuarios
              </label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="users-search"
                type="text"
                placeholder="Buscar por nombre o usuario..."
                value={searchQuery}
                onChange={event => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="role-filter" className="sr-only">
                Filtrar por rol
              </label>
              <select
                id="role-filter"
                value={filterRole}
                onChange={event => {
                  setFilterRole(event.target.value as UserRole | 'todos')
                  setCurrentPage(1)
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-55"
              >
                <option value="todos">Todos los roles</option>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Usuario
                  </th>
                  <th className="hidden p-4 text-left font-medium text-muted-foreground md:table-cell">
                    Username
                  </th>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Rol
                  </th>
                  <th className="hidden p-4 text-left font-medium text-muted-foreground lg:table-cell">
                    Departamento
                  </th>
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="p-4 text-right font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => (
                    <tr
                      key={user.id}
                      className="border-b transition-colors hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <span className="font-semibold text-primary">
                              {user.nombre[0]}
                              {user.apellido[0]}
                            </span>
                          </div>

                          <div>
                            <p className="font-medium">
                              {user.nombre} {user.apellido}
                            </p>
                            <p className="text-sm text-muted-foreground md:hidden">
                              {user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden p-4 md:table-cell">
                        <span className="text-sm">{user.username}</span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[user.role]}`}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>

                      <td className="hidden p-4 lg:table-cell">
                        <span className="text-sm">
                          {getDepartamentoNombre(user.departamentoId)}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            user.status === 'active'
                              ? 'border-green-200 bg-green-100 text-green-800'
                              : 'border-gray-200 bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === 'active' ? 'Desactivar' : 'Activar'}
                            aria-label={
                              user.status === 'active'
                                ? `Desactivar ${user.username}`
                                : `Activar ${user.username}`
                            }
                            className="icon-button hover:bg-secondary"
                          >
                            {user.status === 'active' ? (
                              <UserX className="h-4 w-4 text-red-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditUser(user)}
                            title="Editar"
                            aria-label={`Editar ${user.username}`}
                            className="icon-button hover:bg-secondary"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredUsers.length)} de{' '}
                {filteredUsers.length} usuarios
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(page => page - 1)}
                  disabled={safeCurrentPage === 1}
                  aria-label="Página anterior"
                  className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm">
                  Página {safeCurrentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(page => page + 1)}
                  disabled={safeCurrentPage === totalPages}
                  aria-label="Página siguiente"
                  className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
        
        <UserFormModal
          isOpen={showUserModal}
          isEditing={isEditing}
          formData={formData}
          formError={formError}
          onClose={() => setShowUserModal(false)}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />
      </div>
    </AppLayout>
  )
}