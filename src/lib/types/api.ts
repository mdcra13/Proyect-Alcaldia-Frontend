export interface AuthTokens {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
}

export interface ApiDepartment {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface ApiCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
  departmentId: string
  department?: ApiDepartment
}

export interface AuthenticatedUser {
  id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  role: {
    id: string
    name: string
  }
  departmentId?: string
  department?: ApiDepartment
  createdAt: string
  updatedAt: string
}

export type ApiRequestPriority = 'Baja' | 'Media' | 'Alta' | 'Urgente'

export interface CreateRequestPayload {
  subject: string
  description: string
  applicantName: string
  applicantContact: string
  categoryId: string
  departmentId: string
  priority: ApiRequestPriority
}

export interface CreatedRequest extends CreateRequestPayload {
  id: string
  statusId: string
  receivedById: string
  userAssignedId: string | null
  trackingCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
