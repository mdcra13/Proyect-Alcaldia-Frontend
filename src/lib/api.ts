import type {
  Departamento,
  HistorialEntry,
  Solicitud,
  SolicitudCategoria,
  SolicitudEstado,
  SolicitudPrioridad,
  User,
  UserRole,
} from '@/lib/types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

const TOKEN_STORAGE_KEY = 'alcaldia-access-token'
const REFRESH_TOKEN_STORAGE_KEY = 'alcaldia-refresh-token'

export interface ApiRole {
  id: string
  name: string
}

export interface ApiDepartment {
  id: string
  name: string
  description?: string | null
  isActive?: boolean
}

export interface ApiCategory {
  id: string
  name: string
  description?: string | null
  departmentId?: string
  isActive?: boolean
}

export interface ApiRequestStatus {
  id: string
  name: string
  description?: string | null
  isActive?: boolean
}

export interface ApiUser {
  id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  roleId: string
  role: ApiRole
  departmentId?: string
  department?: ApiDepartment
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

export interface ApiRequestListItem {
  id: string
  subject: string
  applicantName: string
  categoryName: string
  departmentName: string
  statusName: string
  priority: string
  userAssignedName: string | null
  trackingCode: string
  createdAt: string
}

export interface ApiRequestDetails extends ApiRequestListItem {
  description: string
  applicantContact: string
  receivedByName: string
  updatedAt: string
}

export interface CreateRequestPayload {
  subject: string
  description: string
  applicantName: string
  applicantContact: string
  categoryId: string
  departmentId: string
  priority: string
}

export interface ApiRequestHistoryItem {
  id: string
  requestId: string
  eventType: string
  previousStatusId?: string | null
  newStatusId?: string | null
  previousAssignedUserId?: string | null
  newAssignedUserId?: string | null
  observation?: string | null
  userId: string
  createdAt: string
}

function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function persistTokens(auth: AuthResponse) {
  localStorage.setItem(TOKEN_STORAGE_KEY, auth.access_token)
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, auth.refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAccessToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = `Error ${response.status}`

    try {
      const body = await response.json()
      message = body.message ?? body.error ?? message
    } catch {
      // Keep the HTTP status message when the API does not return JSON.
    }

    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function mapApiRoleToUiRole(role?: string): UserRole {
  const normalized = normalizeText(role ?? '')

  if (normalized.includes('admin')) return 'it'
  if (normalized.includes('it')) return 'it'
  if (normalized.includes('alcalde')) return 'alcalde'
  if (normalized.includes('mayor')) return 'alcalde'
  if (normalized.includes('supervisor')) return 'alcalde'
  if (normalized.includes('recepcion')) return 'secretaria'
  if (normalized.includes('secretaria')) return 'secretaria'

  return 'departamento'
}

function mapStatusName(statusName: string): SolicitudEstado {
  const normalized = normalizeText(statusName)

  if (normalized.includes('assigned')) return 'assigned_to_department'
  if (normalized.includes('asignada')) return 'assigned_to_department'
  if (normalized.includes('review')) return 'in_review'
  if (normalized.includes('revision')) return 'in_review'
  if (normalized.includes('approved')) return 'approved_by_department'
  if (normalized.includes('aprobada')) return 'approved_by_department'
  if (normalized.includes('rejected_by_department')) return 'rejected_by_department'
  if (normalized.includes('rechazada') && normalized.includes('departamento')) {
    return 'rejected_by_department'
  }
  if (normalized.includes('awaiting')) return 'awaiting_mayor_signature'
  if (normalized.includes('firma')) return 'awaiting_mayor_signature'
  if (normalized.includes('returned')) return 'returned_to_department'
  if (normalized.includes('devuelta')) return 'returned_to_department'
  if (normalized.includes('mayor') && normalized.includes('rejected')) {
    return 'rejected_by_mayor_office'
  }
  if (normalized.includes('alcaldia') && normalized.includes('rechazada')) {
    return 'rejected_by_mayor_office'
  }
  if (normalized.includes('signed')) return 'signed'
  if (normalized.includes('firmada')) return 'signed'
  if (normalized.includes('closed')) return 'closed'
  if (normalized.includes('cerrada')) return 'closed'

  return 'received'
}

function mapPriority(priority: string): SolicitudPrioridad {
  const normalized = normalizeText(priority)

  if (normalized.includes('urg')) return 'URGENT'
  if (normalized.includes('alta') || normalized.includes('high')) return 'HIGH'
  if (normalized.includes('baja') || normalized.includes('low')) return 'LOW'

  return 'MEDIUM'
}

function mapCategoryName(name: string): SolicitudCategoria {
  const normalized = normalizeText(name)

  if (normalized.includes('educ')) return 'educacion'
  if (normalized.includes('famil')) return 'familiar'
  if (normalized.includes('comun') || normalized.includes('obra')) return 'comunidad'

  return 'salud'
}

export function toDepartamento(apiDepartment: ApiDepartment): Departamento {
  return {
    id: apiDepartment.id,
    nombre: apiDepartment.name,
    descripcion: apiDepartment.description ?? undefined,
    activo: apiDepartment.isActive ?? true,
  }
}

export function toUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    nombre: apiUser.firstName,
    apellido: apiUser.lastName,
    username: apiUser.email,
    role: mapApiRoleToUiRole(apiUser.role?.name),
    departamentoId: apiUser.departmentId,
    departamento: apiUser.department ? toDepartamento(apiUser.department) : undefined,
    status: apiUser.isActive ? 'active' : 'inactive',
    avatar: null,
    createdAt: apiUser.createdAt,
  }
}

export function toSolicitud(
  item: ApiRequestListItem | ApiRequestDetails,
  departments: Departamento[],
): Solicitud {
  const departamento = departments.find(dep => dep.nombre === item.departmentName)
  const createdAt = new Date(item.createdAt)
  const fechaSolicitud = Number.isNaN(createdAt.getTime())
    ? item.createdAt
    : createdAt.toISOString().split('T')[0]

  const description = 'description' in item ? item.description : item.subject
  const applicantContact = 'applicantContact' in item ? item.applicantContact : ''

  return {
    id: item.id,
    radicado: item.trackingCode,
    titulo: item.subject,
    descripcion: description,
    solicitante: item.applicantName,
    identificacion: applicantContact,
    categoria: mapCategoryName(item.categoryName),
    departamentoId: departamento?.id,
    departamento,
    fechaSolicitud,
    fechaLimite: fechaSolicitud,
    estado: mapStatusName(item.statusName),
    prioridad: mapPriority(item.priority),
    subidoPor: 'receivedByName' in item ? item.receivedByName : 'Sistema',
    subidoPorId: '',
    documento: undefined,
    historial: [],
  }
}

export function toHistorialEntry(
  item: ApiRequestHistoryItem,
  statusById: Record<string, ApiRequestStatus>,
): HistorialEntry {
  const newStatus = item.newStatusId ? statusById[item.newStatusId]?.name : undefined

  return {
    id: item.id,
    fecha: item.createdAt,
    accion: newStatus ? mapStatusName(newStatus) : 'received',
    descripcion: item.observation || item.eventType,
    usuario: item.userId,
    usuarioId: item.userId,
  }
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  me() {
    return request<ApiUser>('/auth/me')
  },
  users() {
    return request<ApiUser[]>('/users')
  },
  departments() {
    return request<ApiDepartment[]>('/departments')
  },
  categories() {
    return request<ApiCategory[]>('/categories')
  },
  statuses() {
    return request<ApiRequestStatus[]>('/request-statuses')
  },
  requests() {
    return request<ApiRequestListItem[]>('/requests')
  },
  requestDetails(id: string) {
    return request<ApiRequestDetails>(`/requests/${id}`)
  },
  requestHistory(id: string) {
    return request<ApiRequestHistoryItem[]>(`/requests/${id}/history`)
  },
  createRequest(payload: CreateRequestPayload) {
    return request<ApiRequestDetails | (CreateRequestPayload & { id: string; trackingCode: string; createdAt: string })>(
      '/requests',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
  },
  changeRequestStatus(id: string, statusId: string) {
    return request<ApiRequestDetails>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ statusId }),
    })
  },
  uploadRequestDocument(requestId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return request<{ fileName: string; url: string; requestId: string }>(
      `/requests/${requestId}/documents/upload`,
      {
        method: 'POST',
        body: formData,
      },
    )
  },
}
