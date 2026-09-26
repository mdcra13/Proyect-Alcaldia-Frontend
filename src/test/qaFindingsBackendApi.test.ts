import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { backendApi, mapRole, ApiError } from '@/lib/api/backend'

interface CapturedPayload {
  roleId?: string
  departmentId?: string | null
  [key: string]: unknown
}

describe('QA Findings: backendApi & role mapping', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('rejects unknown roles with a 403 ApiError instead of defaulting to secretaria', () => {
    expect(() => mapRole('unknown_role')).toThrowError(ApiError)
    expect(() => mapRole('unknown_role')).toThrowError(/Rol desconocido/)
    expect(() => mapRole('superuser')).toThrowError(ApiError)
    expect(mapRole('admin')).toBe('it')
    expect(mapRole('it')).toBe('it')
    expect(mapRole('alcalde')).toBe('alcalde')
    expect(mapRole('revisor')).toBe('departamento')
    expect(mapRole('secretaria')).toBe('secretaria')
  })

  it('createRequest throws an ApiError if category or department mapping fails without selecting a silent fallback', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve(
          new Response(JSON.stringify([{ id: 'cat-1', name: 'Salud' }]), { status: 200 })
        )
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    })

    await expect(
      backendApi.createRequest({
        titulo: 'Test',
        descripcion: 'Test',
        solicitante: 'Test',
        identificacion: '123',
        categoria: 'educacion',
        prioridad: 'LOW',
        fechaLimite: '2026-12-31',
      })
    ).rejects.toThrowError(/No se encontró/)
  })

  it('createUser assigns OFFICER role when creating a user with departamento role', async () => {
    const captured: { current: CapturedPayload | null } = { current: null }
    globalThis.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/roles')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: 'role-admin', name: 'ADMIN' },
              { id: 'role-officer', name: 'OFFICER' },
              { id: 'role-supervisor', name: 'SUPERVISOR' },
            ]),
            { status: 200 }
          )
        )
      }
      if (url.includes('/users') && options?.method === 'POST') {
        captured.current = JSON.parse(String(options.body))
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'u-1',
              firstName: 'Juan',
              lastName: 'Pérez',
              email: 'juan@test.com',
              role: { id: 'role-officer', name: 'OFFICER' },
              department: { id: 'dep-1', name: 'Salud' },
              isActive: true,
              createdAt: '2026-01-01',
            }),
            { status: 201 }
          )
        )
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    })

    await backendApi.createUser({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@test.com',
      password: 'password123',
      role: 'departamento',
      departamentoId: 'dep-1',
    })

    expect(captured.current).not.toBeNull()
    expect(captured.current?.roleId).toBe('role-officer')
    expect(captured.current?.departmentId).toBe('dep-1')
  })

  it('updateUser preserves existing supervisor role when role is unchanged', async () => {
    const captured: { current: CapturedPayload | null } = { current: null }
    globalThis.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/roles')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: 'role-admin', name: 'ADMIN' },
              { id: 'role-officer', name: 'OFFICER' },
              { id: 'role-supervisor', name: 'SUPERVISOR' },
            ]),
            { status: 200 }
          )
        )
      }
      if (url.includes('/users/u-sup') && options?.method === 'PATCH') {
        captured.current = JSON.parse(String(options.body))
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'u-sup',
              firstName: 'Supervisor',
              lastName: 'Nuevo',
              email: 'sup@test.com',
              role: { id: 'role-supervisor', name: 'SUPERVISOR' },
              department: { id: 'dep-1', name: 'Salud' },
              isActive: true,
              createdAt: '2026-01-01',
            }),
            { status: 200 }
          )
        )
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    })

    // User is already departamento with roleId 'role-supervisor'
    await backendApi.updateUser('u-sup', {
      nombre: 'Supervisor Editado',
      role: 'departamento',
      roleId: 'role-supervisor',
      departamentoId: 'dep-1',
    })

    expect(captured.current).not.toBeNull()
    expect(captured.current?.roleId).toBe('role-supervisor')
  })

  it('updateUser assigns OFFICER role when role is changed to departamento without existing roleId', async () => {
    const captured: { current: CapturedPayload | null } = { current: null }
    globalThis.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/roles')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: 'role-admin', name: 'ADMIN' },
              { id: 'role-officer', name: 'OFFICER' },
              { id: 'role-supervisor', name: 'SUPERVISOR' },
            ]),
            { status: 200 }
          )
        )
      }
      if (url.includes('/users/u-sec') && options?.method === 'PATCH') {
        captured.current = JSON.parse(String(options.body))
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'u-sec',
              firstName: 'Maria',
              lastName: 'Lopez',
              email: 'maria@test.com',
              role: { id: 'role-officer', name: 'OFFICER' },
              department: { id: 'dep-1', name: 'Salud' },
              isActive: true,
              createdAt: '2026-01-01',
            }),
            { status: 200 }
          )
        )
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    })

    await backendApi.updateUser('u-sec', {
      role: 'departamento',
      departamentoId: 'dep-1',
    })

    expect(captured.current).not.toBeNull()
    expect(captured.current?.roleId).toBe('role-officer')
    expect(captured.current?.departmentId).toBe('dep-1')
  })

  it('changeDepartment validates response and throws ApiError if response is invalid', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'El departamento no está activo' }), { status: 400 })
    )

    await expect(
      backendApi.changeDepartment('req-1', 'dep-invalid', 'Cambio por reasignación')
    ).rejects.toThrowError(/El departamento no está activo/)
  })

  it('createRequest successfully matches real backend category ID and department ID', async () => {
    const captured: { current: CapturedPayload | null } = { current: null }
    globalThis.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/categories')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: 'cat-real-uuid', name: 'Permiso de construcción', departmentId: 'dep-obras-uuid', isActive: true },
            ]),
            { status: 200 }
          )
        )
      }
      if (url.includes('/departments')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: 'dep-obras-uuid', name: 'Obras Públicas', isActive: true },
            ]),
            { status: 200 }
          )
        )
      }
      if (url.includes('/requests') && options?.method === 'POST') {
        captured.current = JSON.parse(String(options.body))
        return Promise.resolve(
          new Response(
            JSON.stringify({ id: 'req-created-uuid' }),
            { status: 201 }
          )
        )
      }
      if (url.includes('/requests/req-created-uuid')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'req-created-uuid',
              subject: 'Permiso para muro perimetral',
              description: 'Construcción en calle 5',
              applicantName: 'Pedro Gómez',
              applicantContact: '456789',
              categoryName: 'Permiso de construcción',
              departmentName: 'Obras Públicas',
              statusName: 'received',
              priority: 'MEDIUM',
              trackingCode: 'RAD-2026-OBR',
              createdAt: '2026-09-26T12:00:00Z',
              updatedAt: '2026-09-26T12:00:00Z',
              receivedById: 'sec-1',
              receivedByName: 'Secretaría General',
              requestDate: '2026-09-26',
              deadline: '2026-10-05',
              documentName: null,
              documentUrl: null,
            }),
            { status: 200 }
          )
        )
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    })

    const result = await backendApi.createRequest({
      titulo: 'Permiso para muro perimetral',
      descripcion: 'Construcción en calle 5',
      solicitante: 'Pedro Gómez',
      identificacion: '456789',
      categoriaId: 'cat-real-uuid',
      departamentoId: 'dep-obras-uuid',
      prioridad: 'MEDIUM',
      fechaSolicitud: '2026-09-26',
      fechaLimite: '2026-10-05',
    })

    expect(captured.current).toEqual(
      expect.objectContaining({
        subject: 'Permiso para muro perimetral',
        categoryId: 'cat-real-uuid',
        departmentId: 'dep-obras-uuid',
        applicantName: 'Pedro Gómez',
      })
    )
    expect(result.id).toBe('req-created-uuid')
    expect(result.trackingCode).toBe('RAD-2026-OBR')
  })
})
