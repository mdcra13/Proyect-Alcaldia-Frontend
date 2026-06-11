import type {
  ApiCategory,
  ApiDepartment,
  AuthenticatedUser,
  AuthTokens,
  CreatedRequest,
  CreateRequestPayload,
} from '@/lib/types/api'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
).replace(/\/$/, '')

interface NestErrorResponse {
  message?: string | string[]
  error?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifique que el backend este activo.',
      0,
    )
  }

  if (!response.ok) {
    let payload: NestErrorResponse | undefined

    try {
      payload = (await response.json()) as NestErrorResponse
    } catch {
      payload = undefined
    }

    const detail = Array.isArray(payload?.message)
      ? payload.message.join('. ')
      : payload?.message

    throw new ApiError(
      detail || payload?.error || `Error del servidor (${response.status})`,
      response.status,
    )
  }

  return response.json() as Promise<T>
}

export function login(email: string, password: string): Promise<AuthTokens> {
  return request<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
  return request<AuthenticatedUser>('/auth/me', {}, accessToken)
}

export function getCategories(accessToken: string): Promise<ApiCategory[]> {
  return request<ApiCategory[]>('/categories', {}, accessToken)
}

export function getDepartments(accessToken: string): Promise<ApiDepartment[]> {
  return request<ApiDepartment[]>('/departments', {}, accessToken)
}

export function createRequest(
  payload: CreateRequestPayload,
  accessToken: string,
): Promise<CreatedRequest> {
  return request<CreatedRequest>(
    '/requests',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
}
