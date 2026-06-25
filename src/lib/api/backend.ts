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
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000/api/v1'

const ACCESS_TOKEN_KEY = 'alcaldia-access-token'
const REFRESH_TOKEN_KEY = 'alcaldia-refresh-token'

let accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? ''

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...init } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(body?.message ?? 'No se pudo completar la solicitud.', response.status)
  }

  return body as T
}

function setTokens(tokens: { access_token: string; refresh_token: string }) {
  accessToken = tokens.access_token
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function clearTokens() {
  accessToken = ''
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

interface BackendAuthResponse {
  access_token: string
  refresh_token: string
}

interface BackendRole {
  id: string
  name: string
}

interface BackendDepartment {
  id: string
  name: string
  description?: string
  isActive?: boolean
}

interface BackendUser {
  id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  role: BackendRole
  departmentId?: string
  department?: BackendDepartment
  createdAt: string
}

interface BackendCategory {
  id: string
  name: string
  description?: string
  isActive?: boolean
  departmentId: string
}

interface BackendStatus {
  id: string
  name: string
  description?: string
}

interface BackendRequestListItem {
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

interface BackendRequestDetails extends BackendRequestListItem {
  description: string
  applicantContact: string
  receivedByName: string
  updatedAt: string
}

interface BackendHistoryEntry {
  id: string
  eventType: string
  observation?: string | null
  userId: string
  createdAt: string
}

export interface BackendCatalogs {
  departments: BackendDepartment[]
  categories: BackendCategory[]
  statuses: BackendStatus[]
}

const LOGIN_ALIASES: Record<string, string> = {
  secretaria: 'recepcionista@demo.local',
  recepcionista: 'recepcionista@demo.local',
  departamento: 'funcionario@demo.local',
  funcionario: 'funcionario@demo.local',
  alcalde: 'supervisor@demo.local',
  supervisor: 'supervisor@demo.local',
  it: 'supervisor@demo.local',
}

const ROLE_MAP: Record<string, UserRole> = {
  receptionist: 'secretaria',
  recepcionista: 'secretaria',
  secretary: 'secretaria',
  officer: 'departamento',
  revisor: 'departamento',
  department_staff: 'departamento',
  supervisor: 'alcalde',
  mayor: 'alcalde',
  alcalde: 'alcalde',
  mayor_office: 'alcalde',
  admin: 'it',
}

const STATUS_MAP: Record<string, SolicitudEstado> = {
  pendiente: 'received',
  received: 'received',
  assigned: 'assigned_to_department',
  assigned_to_department: 'assigned_to_department',
  'en proceso': 'in_review',
  in_progress: 'in_review',
  in_review: 'in_review',
  approved_by_officer: 'approved_by_department',
  department_approved: 'approved_by_department',
  approved_by_department: 'approved_by_department',
  rejected: 'rejected_by_department',
  rejected_by_department: 'rejected_by_department',
  pending_signature: 'awaiting_mayor_signature',
  awaiting_mayor_signature: 'awaiting_mayor_signature',
  returned_to_department: 'returned_to_department',
  rejected_by_mayor_office: 'rejected_by_mayor_office',
  signed: 'signed',
  cerrado: 'closed',
  closed: 'closed',
}

const PRIORITY_FROM_BACKEND: Record<string, SolicitudPrioridad> = {
  baja: 'LOW',
  low: 'LOW',
  media: 'MEDIUM',
  medium: 'MEDIUM',
  alta: 'HIGH',
  high: 'HIGH',
  urgente: 'URGENT',
  urgent: 'URGENT',
}

const PRIORITY_TO_BACKEND: Record<SolicitudPrioridad, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

const CATEGORY_MAP: Record<string, SolicitudCategoria> = {
  salud: 'salud',
  educacion: 'educacion',
  educación: 'educacion',
  familiar: 'familiar',
  comunidad: 'comunidad',
  solicitudes: 'comunidad',
  audiencia: 'comunidad',
  certificaciones: 'comunidad',
  correspondencia: 'comunidad',
  impuestos: 'comunidad',
  construccion: 'comunidad',
  construcción: 'comunidad',
  soporte: 'comunidad',
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function mapRole(roleName?: string): UserRole {
  return ROLE_MAP[normalize(roleName)] ?? 'secretaria'
}

function mapStatus(statusName?: string): SolicitudEstado {
  return STATUS_MAP[normalize(statusName)] ?? 'received'
}

function mapPriority(priority?: string): SolicitudPrioridad {
  return PRIORITY_FROM_BACKEND[normalize(priority)] ?? 'MEDIUM'
}

function mapCategory(categoryName?: string): SolicitudCategoria {
  const normalized = normalize(categoryName)
  const match = Object.entries(CATEGORY_MAP).find(([key]) => normalized.includes(key))
  return match?.[1] ?? 'comunidad'
}

function mapHistoryAction(eventType: string): string {
  const normalized = normalize(eventType)

  if (normalized === 'request_created') return 'Creación'
  if (normalized === 'assigned') return 'Cambio de departamento'
  if (normalized === 'status_changed') return 'Cambio de estado'
  if (normalized === 'internal_observation') return 'Observación interna'

  return eventType
}

function mapHistoryDescription(entry: BackendHistoryEntry): string {
  if (entry.observation) return entry.observation

  const normalized = normalize(entry.eventType)

  if (normalized === 'request_created') return 'Solicitud creada'
  if (normalized === 'assigned') return 'Solicitud asignada'
  if (normalized === 'status_changed') return 'Cambio de estado registrado'
  if (normalized === 'internal_observation') return 'Observación interna registrada'

  return entry.eventType
}

export function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    nombre: user.firstName,
    apellido: user.lastName,
    username: user.email,
    role: mapRole(user.role?.name),
    departamentoId: user.departmentId,
    departamento: user.department
      ? {
          id: user.department.id,
          nombre: user.department.name,
          descripcion: user.department.description,
          activo: user.department.isActive ?? true,
        }
      : undefined,
    status: user.isActive ? 'active' : 'inactive',
    avatar: null,
    createdAt: user.createdAt,
  }
}

export function mapBackendDepartment(department: BackendDepartment): Departamento {
  return {
    id: department.id,
    nombre: department.name,
    descripcion: department.description,
    activo: department.isActive ?? true,
  }
}

export function mapBackendRequest(
  request: BackendRequestListItem | BackendRequestDetails,
  departments: Departamento[] = []
): Solicitud {
  const estado = mapStatus(request.statusName)
  const departamento = departments.find(
    item => item.nombre.toLowerCase() === request.departmentName?.toLowerCase()
  )
  const fechaSolicitud = request.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  const fechaLimite = new Date(request.createdAt || Date.now())
  fechaLimite.setDate(fechaLimite.getDate() + 7)

  return {
    id: request.id,
    radicado: request.trackingCode || request.id,
    titulo: request.subject,
    descripcion: 'description' in request ? request.description : request.subject,
    solicitante: request.applicantName,
    identificacion: 'applicantContact' in request ? request.applicantContact : '',
    categoria: mapCategory(request.categoryName),
    departamentoId: departamento?.id,
    departamento,
    fechaSolicitud,
    fechaLimite: fechaLimite.toISOString().slice(0, 10),
    estado,
    prioridad: mapPriority(request.priority),
    subidoPor: 'receivedByName' in request ? request.receivedByName : 'Backend',
    subidoPorId: 'backend',
    documento: undefined,
    historial: [
      {
        id: `${request.id}-created`,
        fecha: request.createdAt,
        accion: estado,
        descripcion: `Solicitud importada desde backend en estado ${request.statusName}`,
        usuario: 'Backend',
        usuarioId: 'backend',
      },
    ],
  }
}

export function mapBackendHistory(entries: BackendHistoryEntry[]): HistorialEntry[] {
  return entries.map(entry => ({
    id: entry.id,
    fecha: entry.createdAt,
    accion: mapHistoryAction(entry.eventType),
    descripcion: mapHistoryDescription(entry),
    usuario: 'Usuario backend',
    usuarioId: entry.userId,
  }))
}

export function getBackendEmail(username: string) {
  const normalized = normalize(username)
  return username.includes('@') ? username.trim() : LOGIN_ALIASES[normalized] ?? username.trim()
}

export const backendApi = {
  async login(username: string, password: string) {
    const tokens = await apiRequest<BackendAuthResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email: getBackendEmail(username), password }),
    })
    setTokens(tokens)
    return tokens
  },

  me() {
    return apiRequest<BackendUser>('/auth/me')
  },

  users() {
    return apiRequest<BackendUser[]>('/users')
  },

  departments() {
    return apiRequest<BackendDepartment[]>('/departments')
  },

  categories() {
    return apiRequest<BackendCategory[]>('/categories')
  },

  statuses() {
    return apiRequest<BackendStatus[]>('/request-statuses')
  },

  requests() {
    return apiRequest<BackendRequestListItem[]>('/requests')
  },

  requestDetails(id: string) {
    return apiRequest<BackendRequestDetails>(`/requests/${id}`)
  },

  requestHistory(id: string) {
    return apiRequest<BackendHistoryEntry[]>(`/requests/${id}/history`)
  },

  async createRequest(input: {
    titulo: string
    descripcion: string
    solicitante: string
    identificacion: string
    categoria: SolicitudCategoria
    departamentoId?: string
    prioridad?: SolicitudPrioridad
  }) {
    const [categories, departments] = await Promise.all([
      this.categories(),
      this.departments(),
    ])
    const category =
      categories.find(item => mapCategory(item.name) === input.categoria) ?? categories[0]
    const department =
      departments.find(item => item.id === input.departamentoId) ??
      departments.find(item => item.id === category?.departmentId) ??
      departments[0]

    if (!category || !department) {
      throw new ApiError('No hay categorias o departamentos disponibles en backend.', 400)
    }

    return apiRequest<BackendRequestDetails | BackendRequestListItem>('/requests', {
      method: 'POST',
      body: JSON.stringify({
        subject: input.titulo,
        description: input.descripcion,
        applicantName: input.solicitante,
        applicantContact: input.identificacion || 'N/A',
        categoryId: category.id,
        departmentId: department.id,
        priority: PRIORITY_TO_BACKEND[input.prioridad ?? 'MEDIUM'],
      }),
    })
  },

  async changeStatus(id: string, estado: SolicitudEstado) {
    const statuses = await this.statuses()
    const status = statuses.find(item => mapStatus(item.name) === estado)
    if (!status) {
      throw new ApiError(`El backend no tiene el estado ${estado}.`, 400)
    }

    return apiRequest<BackendRequestDetails>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ statusId: status.id }),
    })
  },
}
