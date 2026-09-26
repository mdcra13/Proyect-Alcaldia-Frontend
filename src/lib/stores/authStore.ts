import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { backendApi, clearTokens, getAccessToken, mapBackendUser, ApiError } from '@/lib/api/backend'
import type { User, UserFormData, UserRole } from '@/lib/types'

interface LoginResult {
  success: boolean
  error?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  rememberSession: boolean
  users: User[]
  isCheckingSession: boolean
  sessionError: string | null
  initSession: () => Promise<void>
  login: (username: string, password: string, remember: boolean) => Promise<LoginResult>
  logout: () => void
  fetchUsers: () => Promise<void>
  updateUser: (userId: string, updates: Partial<User>) => Promise<User>
  updateCurrentUser: (updates: Partial<User>) => Promise<User | null>
  addUser: (newUser: UserFormData) => Promise<User>
  toggleUserStatus: (userId: string) => Promise<User>
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
      isCheckingSession: Boolean(getAccessToken()),
      sessionError: null,

      initSession: async () => {
        const token = getAccessToken()
        if (!token) {
          set({ isCheckingSession: false, sessionError: null })
          return
        }

        set({ isCheckingSession: true, sessionError: null })
        try {
          const user = mapBackendUser(await backendApi.me())
          set({ user, isAuthenticated: true, isCheckingSession: false, sessionError: null })

          if (user.role === 'it') {
            try {
              const users = (await backendApi.users()).map(mapBackendUser)
              set({ users })
            } catch {
              set({ users: [user] })
            }
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            clearTokens()
            set({ user: null, isAuthenticated: false, isCheckingSession: false, sessionError: null })
          } else {
            set({
              isCheckingSession: false,
              sessionError: error instanceof Error ? error.message : 'Error de conexión con el servidor.',
            })
          }
        }
      },

      login: async (username, password, remember) => {
        try {
          await backendApi.login(username, password)
          const user = mapBackendUser(await backendApi.me())
          set({ user, isAuthenticated: true, rememberSession: remember })

          if (user.role === 'it') {
            try {
              const users = (await backendApi.users()).map(mapBackendUser)
              set({ users })
            } catch {
              set({ users: [user] })
            }
          }
          return { success: true }
        } catch (error) {
          clearTokens()
          return {
            success: false,
            error: error instanceof Error
              ? error.message
              : 'Credenciales incorrectas. Verifique su usuario y contraseña.',
          }
        }
      },

      logout: () => {
        clearTokens()
        set({ user: null, isAuthenticated: false, rememberSession: false, users: [], isCheckingSession: false, sessionError: null })
      },

      fetchUsers: async () => {
        const users = (await backendApi.users()).map(mapBackendUser)
        set({ users })
      },

      updateUser: async (userId, updates) => {
        const updated = mapBackendUser(await backendApi.updateUser(userId, {
          nombre: updates.nombre,
          apellido: updates.apellido,
          email: updates.username,
          role: updates.role,
          roleId: updates.roleId,
          departamentoId: updates.departamentoId,
          isActive: updates.status ? updates.status === 'active' : undefined,
        }))
        set(state => ({
          users: state.users.map(user => user.id === userId ? updated : user),
          user: state.user?.id === userId ? updated : state.user,
        }))
        return updated
      },

      updateCurrentUser: async updates => {
        const currentUser = get().user
        if (!currentUser) return null
        return get().updateUser(currentUser.id, updates)
      },

      addUser: async newUser => {
        const created = mapBackendUser(await backendApi.createUser({
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          email: newUser.username,
          password: newUser.password,
          role: newUser.role,
          departamentoId: newUser.departamentoId,
        }))
        set(state => ({ users: [...state.users, created] }))
        return created
      },

      toggleUserStatus: async userId => {
        const currentUser = get().user
        const user = get().users.find(item => item.id === userId)
        if (!user) throw new Error('Usuario no encontrado')
        if (currentUser?.id === userId && user.status === 'active') {
          throw new Error('Un administrador no puede desactivarse a sí mismo.')
        }
        return get().updateUser(userId, {
          status: user.status === 'active' ? 'inactive' : 'active',
        })
      },

      isUsernameUnique: (username, excludeId) => {
        const normalized = username.trim().toLowerCase()
        return !get().users.some(user =>
          user.username.toLowerCase() === normalized && user.id !== excludeId
        )
      },
      getUsersByRole: role => get().users.filter(user => user.role === role),
      getUsersByDepartamento: departamentoId =>
        get().users.filter(user => user.departamentoId === departamentoId),
    }),
    {
      name: 'auth-storage',
      partialize: state => state.rememberSession
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
