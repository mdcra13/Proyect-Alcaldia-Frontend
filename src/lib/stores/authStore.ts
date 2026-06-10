import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserStatus, UserFormData } from '@/lib/types'

const mockUsers: User[] = [
  {
    id: '1',
    nombre: 'Carlos Rodríguez',
    username: 'carlos',
    apellido: 'Rodríguez',
    role: 'alcalde',
    avatar: null,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    nombre: 'María García',
    username: 'maria',
    apellido: 'García',
    role: 'secretaria',
    avatar: null,
    status: 'active',
    createdAt: '2024-02-01',
  },
]

interface LoginResult {
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
  addUser: (newUser: UserFormData) => User
  toggleUserStatus: (userId: string) => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      rememberSession: false,
      users: mockUsers,

      login: (username: string, password: string, remember: boolean): LoginResult => {
        // TODO: Replace mock login with POST /api/v1/auth/login when backend is ready.
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
        set({ user: null, isAuthenticated: false })
      },

      updateUser: (userId: string, updates: Partial<User>) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, ...updates } : user
          ),
        }))
      },

      addUser: (newUser: UserFormData): User => {
        const user: User = {
          ...newUser,
          id: String(Date.now()),
          avatar: null,
          createdAt: new Date().toISOString().split('T')[0],
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
              : user
          ),
        }))
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

export default useAuthStore