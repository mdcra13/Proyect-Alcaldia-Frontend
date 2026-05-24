// User types
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

// Solicitud types
export type SolicitudCategoria = 'salud' | 'educacion' | 'familiar' | 'comunidad'
export type SolicitudEstado = 'pendiente' | 'en_revision' | 'aprobado' | 'declinado'
export type SolicitudPrioridad = 'baja' | 'media' | 'alta'

export interface Solicitud {
  id: string
  radicado: string
  titulo: string
  solicitante: string
  identificacion: string
  categoria: SolicitudCategoria
  fechaIngreso: string
  descripcion: string
  estado: SolicitudEstado
  prioridad: SolicitudPrioridad
  subidoPor: string
  documento: string
  motivoRechazo?: string | null
}

export interface SolicitudStats {
  total: number
  pendientes: number
  aprobadas: number
  declinadas: number
}

export interface SolicitudFilters {
  categorias?: SolicitudCategoria[]
  estado?: string
  prioridad?: SolicitudPrioridad | 'todas'
  fechaDesde?: string
  fechaHasta?: string
  ordenar?: 'reciente' | 'antiguo' | 'nombre'
}

// Notification types
export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export interface AppNotification {
  id: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
}

export type Notification = AppNotification

// Category config
export interface CategoryConfig {
  label: string
  icon: string
  color: string
  iconBg: string
}

export type CategoriesMap = Record<SolicitudCategoria, CategoryConfig>

// Form types
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

export interface SolicitudFormData {
  categoria: SolicitudCategoria | ''
  solicitante: string
  identificacion: string
  fechaSolicitud: string
  descripcion: string
}