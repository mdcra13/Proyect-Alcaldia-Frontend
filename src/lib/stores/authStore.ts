import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, clearTokens, persistTokens, toUser } from '@/lib/api'
import type { User, UserFormData, UserRole, UserStatus } from '@/lib/types'

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
  login: (username: string, password: string, remember: boolean) => Promise<LoginResult>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  fetchUsers: () => Promise<void>
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
      users: [],

      login: async (
        username: string,
        password: string,
        remember: boolean,
      ): Promise<LoginResult> => {
        try {
          const auth = await api.login(username.trim().toLowerCase(), password)
          persistTokens(auth)

          const apiUser = await api.me()
          const user = toUser(apiUser)

          set({
            user,
            isAuthenticated: true,
            rememberSession: remember,
          })

          return { success: true }
        } catch (error) {
          clearTokens()

          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Credenciales incorrectas. Verifique su usuario y contrasena.',
          }
        }
      },

      logout: () => {
        clearTokens()
        set({
          user: null,
          isAuthenticated: false,
          rememberSession: false,
        })
      },

      fetchCurrentUser: async () => {
        const apiUser = await api.me()
        const user = toUser(apiUser)

        set({
          user,
          isAuthenticated: true,
        })
      },

      fetchUsers: async () => {
        const users = (await api.users()).map(toUser)
        set({ users })
      },

      updateUser: (userId: string, updates: Partial<User>) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, ...updates } : user,
          ),
          user:
            state.user?.id === userId
              ? { ...state.user, ...updates }
              : state.user,
        }))
      },

      updateCurrentUser: (updates: Partial<User>) => {
        const currentUser = get().user

        if (!currentUser) return

        set(state => ({
          user: { ...currentUser, ...updates },
          users: state.users.map(user =>
            user.id === currentUser.id ? { ...user, ...updates } : user,
          ),
        }))
      },

      addUser: (newUser: UserFormData): User => {
        const user: User = {
          id: crypto.randomUUID(),
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          username: newUser.username,
          role: newUser.role,
          departamentoId: newUser.departamentoId,
          status: newUser.status,
          avatar: null,
          createdAt: new Date().toISOString(),
        }

        set(state => ({
          users: [...state.users, user],
        }))

        return user
      },

      toggleUserStatus: (userId: string) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId
              ? {
                  ...user,
                  status: (user.status === 'active' ? 'inactive' : 'active') as UserStatus,
                }
              : user,
          ),
        }))
      },

      changePassword: (
        currentPassword: string,
        newPassword: string,
      ): PasswordChangeResult => {
        if (currentPassword.length < 1) {
          return {
            success: false,
            error: 'La contrasena actual es requerida.',
          }
        }

        if (newPassword.length < 8) {
          return {
            success: false,
            error: 'La nueva contrasena debe tener al menos 8 caracteres.',
          }
        }

        return { success: true }
      },

      isUsernameUnique: (username: string, excludeId?: string): boolean => {
        const normalizedUsername = username.trim().toLowerCase()

        return !get().users.some(
          user =>
            user.username.toLowerCase() === normalizedUsername &&
            user.id !== excludeId,
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
    },
  ),
)

export { useAuthStore }
export default useAuthStore
