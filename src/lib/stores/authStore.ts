import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserStatus, UserFormData } from '@/lib/types'

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Carlos Rodríguez',
    email: 'alcalde@municipio.gov',
    role: 'alcalde',
    avatar: null,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'María García',
    email: 'secretaria@municipio.gov',
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
        // Mock login - in production this would call an API
        const user = get().users.find(
          u => u.email === username && u.status === 'active'
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
          users: state.users.map(u =>
            u.id === userId ? { ...u, ...updates } : u
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
          users: state.users.map(u =>
            u.id === userId
              ? { ...u, status: (u.status === 'active' ? 'inactive' : 'active') as UserStatus }
              : u
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