export type UserRole = 'alcalde' | 'secretaria' | 'administrador'
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string | null
  status: UserStatus
  createdAt: string
}

export interface LoginFormData {
  username: string
  password: string
  remember: boolean
}

export interface UserFormData {
  name: string
  email: string
  role: UserRole
  status: UserStatus
}