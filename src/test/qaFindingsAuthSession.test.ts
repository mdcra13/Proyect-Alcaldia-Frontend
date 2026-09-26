import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import useAuthStore from '@/lib/stores/authStore'
import { backendApi, ApiError, setTokens, getAccessToken, clearTokens } from '@/lib/api/backend'

describe('QA Findings: Auth Session & Admin Self-Deactivation', () => {
  beforeEach(() => {
    localStorage.clear()
    clearTokens()
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isCheckingSession: false,
      sessionError: null,
      users: [],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearTokens()
  })

  it('restores user session when a valid access token is present', async () => {
    setTokens('valid-access-token', 'valid-refresh-token')
    vi.spyOn(backendApi, 'me').mockResolvedValue({
      id: 'it-1',
      firstName: 'Admin',
      lastName: 'IT',
      email: 'admin@alcaldia.gov.co',
      role: { id: 'r-1', name: 'ADMIN' },
      isActive: true,
      createdAt: '2026-01-01',
    })
    vi.spyOn(backendApi, 'users').mockResolvedValue([])

    await useAuthStore.getState().initSession()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).not.toBeNull()
    expect(state.user?.role).toBe('it')
    expect(state.sessionError).toBeNull()
    expect(state.isCheckingSession).toBe(false)
  })

  it('clears tokens and logs out if /auth/me returns 401 Unauthorized', async () => {
    setTokens('expired-access-token', 'expired-refresh-token')
    vi.spyOn(backendApi, 'me').mockRejectedValue(new ApiError('Token inválido', 401))

    await useAuthStore.getState().initSession()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(state.isCheckingSession).toBe(false)
    expect(state.sessionError).toBeNull()
  })

  it('keeps tokens and sets sessionError to allow retry if /auth/me fails due to network', async () => {
    setTokens('valid-access-token', 'valid-refresh-token')
    vi.spyOn(backendApi, 'me').mockRejectedValue(new TypeError('Failed to fetch'))

    await useAuthStore.getState().initSession()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(getAccessToken()).toBe('valid-access-token') // Tokens are NOT cleared!
    expect(state.isCheckingSession).toBe(false)
    expect(state.sessionError).toBe('Failed to fetch')
  })

  it('prevents an admin user from deactivating themselves in toggleUserStatus', async () => {
    const adminUser = {
      id: 'admin-1',
      nombre: 'Admin',
      apellido: 'Principal',
      username: 'admin',
      role: 'it' as const,
      avatar: null,
      status: 'active' as const,
      createdAt: '2026-01-01',
    }

    useAuthStore.setState({
      user: adminUser,
      users: [adminUser],
      isAuthenticated: true,
    })

    await expect(
      useAuthStore.getState().toggleUserStatus('admin-1')
    ).rejects.toThrowError('Un administrador no puede desactivarse a sí mismo.')
  })
})
