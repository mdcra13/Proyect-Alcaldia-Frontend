// src/lib/stores/authStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  User,
  UserFormData,
} from '@/lib/types'

/**
 * Mock base de usuarios del sistema
 * (NO eliminar — usado como seed inicial)
 */
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

  login: (
    username: string,
    password: string,
    remember: boolean
  ) => LoginResult

  logout: () => void

  updateUser: (
    userId: string,
    updates: Partial<User>
  ) => void

  addUser: (newUser: UserFormData) => User

  toggleUserStatus: (userId: string) => void
}

/**
 * STORE PRINCIPAL
 * - auth + admin users management
 * - persist opcional según rememberSession
 */
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      rememberSession: false,

      /**
       * Se inicializa con mockUsers
       * y luego puede evolucionar en runtime
       */
      users: mockUsers,

      /**
       * LOGIN
       * ahora acepta:
       * - email o username (flexible para UI)
       * - password mock fijo
       */
      login: (username, password, remember) => {
        const normalizedInput = username
          .trim()
          .toLowerCase()

        const user = get().users.find(
          (u) =>
            u.status === 'active' &&
            (
              u.email.toLowerCase() ===
                normalizedInput ||
              u.name.toLowerCase() ===
                normalizedInput
            )
        )

        // MOCK PASSWORD (seguro solo para dev)
        const VALID_PASSWORD = 'admin123'

        if (user && password === VALID_PASSWORD) {
          set({
            user,
            isAuthenticated: true,
            rememberSession: remember,
          })

          return { success: true }
        }

        return {
          success: false,
          error:
            'Credenciales inválidas o usuario inactivo',
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        })
      },

      updateUser: (userId, updates) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId
              ? { ...u, ...updates }
              : u
          ),
        }))
      },

      addUser: (newUser) => {
        const user: User = {
          ...newUser,
          id: String(Date.now()),
          avatar: null,
          createdAt:
            new Date()
              .toISOString()
              .split('T')[0],
        }

        set((state) => ({
          users: [...state.users, user],
        }))

        return user
      },

      toggleUserStatus: (userId) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  status:
                    u.status === 'active'
                      ? 'inactive'
                      : 'active',
                }
              : u
          ),
        }))
      },
    }),

    {
      name: 'auth-storage',

      /**
       * FIX IMPORTANTE:
       * persistía solo si rememberSession === true
       *
       * Eso en Zustand NO es estable porque depende del runtime state.
       *
       * Mejor: persistir SIEMPRE user + flag,
       * y controlar logout manualmente.
       */
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        rememberSession: state.rememberSession,
      }),
    }
  )
)

export default useAuthStore