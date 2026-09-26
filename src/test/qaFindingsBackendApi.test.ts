import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { backendApi, mapRole, ApiError } from '@/lib/api/backend'

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
    expect(() => mapRole('unknown_role')).toThrowError(/Rol desconocido o no autorizado/)
    expect(() => mapRole('superuser')).toThrowError(ApiError)
    expect(mapRole('admin')).toBe('it')
    expect(mapRole('it')).toBe('it')
    expect(mapRole('alcalde')).toBe('alcalde')
    expect(mapRole('revisor')).toBe('departamento')
    expect(mapRole('secretaria')).toBe('secretaria')
  })

  it('createRequest throws an ApiError if category or department mapping fails without selecting a silent fallback', async () => {
    // Mock categories without matching category
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            { id: 'cat-1', name: 'Salud' },
          ]),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
    })

    await expect(
      backendApi.createRequest({
        titulo: 'Test',
        descripcion: 'Test',
        solicitante: 'Test',
        identificacion: '123',
        categoria: 'educacion', // not in categories mock
        prioridad: 'LOW',
        fechaLimite: '2026-12-31',
      })
    ).rejects.toThrowError(/No se encontró la categoría/)
  })

  it('createUser assigns OFFICER role when creating a user with departamento role', async () => {
    let capturedBody: any = null
    globalThis.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url.includes('/roles')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            { id: 'role-admin', name: 'ADMIN' },
            { id: 'role-officer', name: 'OFFICER' },
            { id: 'role-supervisor', name: 'SUPERVISOR' },
          ]),
        })
      }
      if (url.includes('/users') && options?.method === 'POST') {
        capturedBody = JSON.parse(options.body)
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            id: 'u-1',
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@test.com',
            role: { id: 'role-officer', name: 'OFFICER' },
            department: { id: 'dep-1', name: 'Salud' },
            isActive: true,
            createdAt: '2026-01-01',
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
    })

    await backendApi.createUser({
      nombre: 'Juan',
      apellido: 'Pérez',
      username: 'juan.perez',
      password: 'password123',
      role: 'departamento',
      departamentoId: 'dep-1',
    })

    expect(capturedBody).not.toBeNull()
    expect(capturedBody.roleId).toBe('role-officer')
    expect(capturedBody.departmentId).toBe('dep-1')
  })

  it('updateUser preserves existing supervisor role when role is unchanged', async () => {
    let capturedBody: any = null
    globalThis.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url.includes('/roles')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            { id: 'role-admin', name: 'ADMIN' },
            { id: 'role-officer', name: 'OFFICER' },
            { id: 'role-supervisor', name: 'SUPERVISOR' },
          ]),
        })
      }
      if (url.includes('/users/u-sup') && options?.method === 'PATCH') {
        capturedBody = JSON.parse(options.body)
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'u-sup',
            firstName: 'Supervisor',
            lastName: 'Nuevo',
            email: 'sup@test.com',
            role: { id: 'role-supervisor', name: 'SUPERVISOR' },
            department: { id: 'dep-1', name: 'Salud' },
            isActive: true,
            createdAt: '2026-01-01',
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
    })

    // User is already departamento with roleId 'role-supervisor'
    await backendApi.updateUser('u-sup', {
      nombre: 'Supervisor Editado',
      role: 'departamento',
      roleId: 'role-supervisor',
      departamentoId: 'dep-1',
    })

    expect(capturedBody).not.toBeNull()
    expect(capturedBody.roleId).toBe('role-supervisor')
  })

  it('updateUser assigns OFFICER role when role is changed to departamento without existing roleId', async () => {
    let capturedBody: any = null
    globalThis.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url.includes('/roles')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            { id: 'role-admin', name: 'ADMIN' },
            { id: 'role-officer', name: 'OFFICER' },
            { id: 'role-supervisor', name: 'SUPERVISOR' },
          ]),
        })
      }
      if (url.includes('/users/u-sec') && options?.method === 'PATCH') {
        capturedBody = JSON.parse(options.body)
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'u-sec',
            firstName: 'Maria',
            lastName: 'Lopez',
            email: 'maria@test.com',
            role: { id: 'role-officer', name: 'OFFICER' },
            department: { id: 'dep-1', name: 'Salud' },
            isActive: true,
            createdAt: '2026-01-01',
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
    })

    await backendApi.updateUser('u-sec', {
      role: 'departamento',
      departamentoId: 'dep-1',
    })

    expect(capturedBody).not.toBeNull()
    expect(capturedBody.roleId).toBe('role-officer')
    expect(capturedBody.departmentId).toBe('dep-1')
  })

  it('changeDepartment validates response and throws ApiError if response is invalid', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'El departamento no está activo' }),
    })

    await expect(
      backendApi.changeDepartment('req-1', 'dep-invalid', 'Cambio por reasignación')
    ).rejects.toThrowError(/El departamento no está activo/)
  })
})
