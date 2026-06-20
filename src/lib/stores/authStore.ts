import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockDepartamentos } from '@/lib/stores/departamentosStore'
import type { Departamento, User, UserFormData, UserRole, UserStatus } from '@/lib/types'

const departamentosById = mockDepartamentos.reduce<Record<string, Departamento>>(
  (acc, departamento) => {
    acc[departamento.id] = departamento
    return acc
  },
  {}
)

const mockUsers: User[] = [
  {
    id: '1',
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    username: 'alcalde',
    role: 'alcalde',
    avatar: null,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    nombre: 'María',
    apellido: 'García',
    username: 'secretaria',
    role: 'secretaria',
    avatar: null,
    status: 'active',
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    nombre: 'Juan',
    apellido: 'Hernández',
    username: 'departamento',
    role: 'departamento',
    departamentoId: 'dep-1',
    departamento: departamentosById['dep-1'],
    avatar: null,
    status: 'active',
    createdAt: '2024-02-15',
  },
  {
    id: '4',
    nombre: 'Laura',
    apellido: 'Mendoza',
    username: 'departamento2',
    role: 'departamento',
    departamentoId: 'dep-2',
    departamento: departamentosById['dep-2'],
    avatar: null,
    status: 'active',
    createdAt: '2024-02-16',
  },
  {
    id: '5',
    nombre: 'Pedro',
    apellido: 'Martínez',
    username: 'it',
    role: 'it',
    avatar: null,
    status: 'active',
    createdAt: '2024-01-20',
  },
]

interface LoginResult {
  success: boolean
  error?: string
}

interface PasswordChangeResult {
  success: boolean
  error?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  rememberSession: boolean
  users: User[]
  login: (username: string, password: string, remember: boolean) => LoginResult
  logout: () => void
  updateUser: (userId: string, updates: Partial<User>) => void
  updateCurrentUser: (updates: Partial<User>) => void
  addUser: (newUser: UserFormData) => User
  toggleUserStatus: (userId: string) => void
  changePassword: (currentPassword: string, newPassword: string) => PasswordChangeResult
  isUsernameUnique: (username: string, excludeId?: string) => boolean
  getUsersByRole: (role: UserRole) => User[]
  getUsersByDepartamento: (departamentoId: string) => User[]
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      rememberSession: false,
      users: mockUsers,

      login: (username: string, password: string, remember: boolean): LoginResult => {
        // TODO: Replace with API call POST /api/v1/auth/login
        const normalizedUsername = username.trim().toLowerCase()
        const user = get().users.find(
          item =>
            item.username.toLowerCase() === normalizedUsername &&
            item.status === 'active'
        )

        if (user && password === 'admin123') {
          set({
            user,
            isAuthenticated: true,
            rememberSession: remember,
          })

          return { success: true }
        }

        return {
          success: false,
          error: 'Credenciales incorrectas. Verifique su usuario y contraseña.',
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          rememberSession: false,
        })
      },

      updateUser: (userId: string, updates: Partial<User>) => {
        // TODO: Replace with API call PATCH /api/v1/users/:id
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, ...updates } : user
          ),
          user:
            state.user?.id === userId
              ? { ...state.user, ...updates }
              : state.user,
        }))
      },

      updateCurrentUser: (updates: Partial<User>) => {
        // TODO: Replace with API call PATCH /api/v1/users/:id
        const currentUser = get().user

        if (!currentUser) return

        set(state => ({
          user: { ...currentUser, ...updates },
          users: state.users.map(user =>
            user.id === currentUser.id ? { ...user, ...updates } : user
          ),
        }))
      },

      addUser: (newUser: UserFormData): User => {
        // TODO: Replace with API call POST /api/v1/users
        const departamento = newUser.departamentoId
          ? departamentosById[newUser.departamentoId]
          : undefined

        const user: User = {
          id: String(Date.now()),
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          username: newUser.username,
          role: newUser.role,
          departamentoId: newUser.departamentoId,
          departamento,
          status: newUser.status,
          avatar: null,
          createdAt: new Date().toISOString().split('T')[0],
        }

        set(state => ({
          users: [...state.users, user],
        }))

        return user
      },

      toggleUserStatus: (userId: string) => {
        // TODO: Replace with API call PATCH /api/v1/users/:id
        set(state => ({
          users: state.users.map(user =>
            user.id === userId
              ? {
                  ...user,
                  status: (user.status === 'active' ? 'inactive' : 'active') as UserStatus,
                }
              : user
          ),
        }))
      },

      changePassword: (
        currentPassword: string,
        newPassword: string
      ): PasswordChangeResult => {
        // TODO: Replace with API call PATCH /api/v1/users/:id
        if (currentPassword !== 'admin123') {
          return {
            success: false,
            error: 'La contraseña actual es incorrecta.',
          }
        }

        if (newPassword.length < 8) {
          return {
            success: false,
            error: 'La nueva contraseña debe tener al menos 8 caracteres.',
          }
        }

        return { success: true }
      },

      isUsernameUnique: (username: string, excludeId?: string): boolean => {
        const normalizedUsername = username.trim().toLowerCase()

        return !get().users.some(
          user =>
            user.username.toLowerCase() === normalizedUsername &&
            user.id !== excludeId
        )
      },

      getUsersByRole: (role: UserRole): User[] => {
        return get().users.filter(user => user.role === role)
      },

      getUsersByDepartamento: (departamentoId: string): User[] => {
        return get().users.filter(user => user.departamentoId === departamentoId)
      },
    }),
    {
      name: 'auth-storage',
      partialize: state =>
        state.rememberSession
          ? {
              user: state.user,
              isAuthenticated: state.isAuthenticated,
              rememberSession: state.rememberSession,
            }
          : {},
    }
  )
)

export { useAuthStore }
export default useAuthStore