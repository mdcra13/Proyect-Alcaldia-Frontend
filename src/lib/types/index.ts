// Departamento types
export interface Departamento {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
}

// User types
export type UserRole = 'secretaria' | 'departamento' | 'alcalde' | 'it'
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  nombre: string
  apellido: string
  username: string
  role: UserRole
  departamentoId?: string
  departamento?: Departamento
  status: UserStatus
  avatar?: string | null
  createdAt: string
}

// Solicitud types
export type SolicitudCategoria = 'salud' | 'educacion' | 'familiar' | 'comunidad'

export type SolicitudEstado =
  | 'received'
  | 'assigned_to_department'
  | 'in_review'
  | 'approved_by_department'
  | 'rejected_by_department'
  | 'awaiting_mayor_signature'
  | 'returned_to_department'
  | 'rejected_by_mayor_office'
  | 'signed'
  | 'closed'

export type SolicitudPrioridad = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface HistorialEntry {
  id: string
  fecha: string
  accion: string
  descripcion: string
  usuario: string
  usuarioId: string
}

export interface Solicitud {
  id: string
  radicado: string
  titulo: string
  descripcion: string
  solicitante: string
  identificacion: string
  categoria: SolicitudCategoria
  departamentoId?: string
  departamento?: Departamento
  fechaIngreso: string
  fechaSolicitud: string
  fechaLimite: string
  estado: SolicitudEstado
  prioridad: SolicitudPrioridad
  subidoPor: string
  subidoPorId: string
  documento?: string
  motivoRechazo?: string | null
  historial: HistorialEntry[]
}

export type UrgenciaLevel = 'vencida' | 'urgente' | 'proxima' | 'normal'

export interface SolicitudStats {
  total: number
  pendientes: number
  aprobadas: number
  declinadas: number
  enRevision: number
  finalizadas: number
}

export type SolicitudEstadoFiltro =
  | SolicitudEstado
  | 'todos'
  | 'pendientes'
  | 'en_proceso'
  | 'aprobado'
  | 'declinado'

export interface SolicitudFilters {
  categorias?: SolicitudCategoria[]
  estado?: SolicitudEstadoFiltro
  departamentoId?: string
  prioridad?: SolicitudPrioridad | 'todas'
  fechaDesde?: string
  fechaHasta?: string
  ordenar?: 'fecha_limite' | 'reciente' | 'antiguo' | 'nombre'
}

// Notification types
export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
}

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
  nombre: string
  apellido: string
  username: string
  role: UserRole
  departamentoId?: string
  status: UserStatus
}

export interface SolicitudFormData {
  titulo: string
  categoria: SolicitudCategoria | ''
  departamentoId?: string
  fechaSolicitud: string
  fechaLimite: string
  solicitante: string
  identificacion: string
  descripcion: string
  documento?: File | null
}

export const ESTADO_TRANSITIONS_DEPARTAMENTO: Partial<
  Record<SolicitudEstado, SolicitudEstado[]>
> = {
  assigned_to_department: ['in_review'],
  in_review: ['approved_by_department', 'rejected_by_department'],
  returned_to_department: ['in_review'],
}

export const ESTADO_TRANSITIONS_ALCALDE: Partial<
  Record<SolicitudEstado, SolicitudEstado[]>
> = {
  approved_by_department: ['awaiting_mayor_signature'],
  awaiting_mayor_signature: [
    'signed',
    'returned_to_department',
    'rejected_by_mayor_office',
  ],
  signed: ['closed'],
}

export const ROLE_LABELS: Record<UserRole, string> = {
  secretaria: 'Secretaria',
  departamento: 'Departamento',
  alcalde: 'Alcalde',
  it: 'Operador IT',
}

export const PRIORIDAD_LABELS: Record<SolicitudPrioridad, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export const ESTADO_CONFIG: Record<
  SolicitudEstado,
  { label: string; color: string }
> = {
  received: {
    label: 'Recibida',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  assigned_to_department: {
    label: 'Asignada a departamento',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  in_review: {
    label: 'En revisión',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  approved_by_department: {
    label: 'Aprobada por departamento',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  rejected_by_department: {
    label: 'Rechazada por departamento',
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  awaiting_mayor_signature: {
    label: 'Pendiente de firma',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  returned_to_department: {
    label: 'Devuelta a departamento',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  rejected_by_mayor_office: {
    label: 'Rechazada por Alcaldía',
    color: 'bg-red-200 text-red-800 border-red-300',
  },
  signed: {
    label: 'Firmada',
    color: 'bg-green-200 text-green-800 border-green-300',
  },
  closed: {
    label: 'Cerrada',
    color: 'bg-gray-200 text-gray-700 border-gray-300',
  },
}