import 'vitest-axe/extend-expect'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import ITDashboard from '@/components/it/ITDashboard'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { Departamento, User } from '@/lib/types'

const itUser: User = {
    id: '10',
    nombre: 'Carlos',
    apellido: 'Méndez',
    username: 'it.admin',
    role: 'it',
    departamentoId: undefined,
    departamento: undefined,
    avatar: null,
    status: 'active',
    createdAt: '2024-01-10',
    }

    const mockUsers: User[] = [
    itUser,
    {
        id: '1', nombre: 'Alcalde', apellido: 'Test', username: 'alcalde',
        role: 'alcalde', avatar: null, status: 'active', createdAt: '2024-01-01',
    },
    {
        id: '2', nombre: 'Secretaria', apellido: 'Test', username: 'sec',
        role: 'secretaria', avatar: null, status: 'inactive', createdAt: '2024-01-02',
    },
    ]

    const mockDepartamentos: Departamento[] = [
    { id: 'dep-1', nombre: 'Salud',     activo: true },
    { id: 'dep-2', nombre: 'Educación', activo: false },
    ]

    function renderITDashboard() {
    return render(
        <BrowserRouter>
        <ITDashboard />
        </BrowserRouter>,
    )
    }

    describe('ITDashboard', () => {
    beforeEach(() => {
        useAuthStore.setState({ user: itUser, users: mockUsers, isAuthenticated: true, rememberSession: false })
        useDepartamentosStore.setState({ departamentos: mockDepartamentos })
    })

    it('has no accessibility violations', async () => {
        const { container } = renderITDashboard()
        expect(await axe(container)).toHaveNoViolations()
    })
})