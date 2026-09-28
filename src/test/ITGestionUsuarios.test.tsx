import 'vitest-axe/extend-expect'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { axe } from 'vitest-axe'
import ITGestionUsuarios from '@/components/it/ITGestionUsuarios'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { Departamento, User } from '@/lib/types'

const itUser: User = {
    id: '10', nombre: 'Carlos', apellido: 'Méndez', username: 'it.admin',
    role: 'it', avatar: null, status: 'active', createdAt: '2024-01-10',
    }

    const mockUsers: User[] = [
    itUser,
    {
        id: '1', nombre: 'Ana', apellido: 'García', username: 'alcalde',
        role: 'alcalde', avatar: null, status: 'active', createdAt: '2024-01-01',
    },
    {
        id: '2', nombre: 'María', apellido: 'López', username: 'secretaria',
        role: 'secretaria', avatar: null, status: 'inactive', createdAt: '2024-01-02',
    },
    {
        id: '3', nombre: 'Juan', apellido: 'Hernández', username: 'dep.salud',
        role: 'departamento', departamentoId: 'dep-1',
        avatar: null, status: 'active', createdAt: '2024-02-01',
    },
    ]

    const mockDepartamentos: Departamento[] = [
    { id: 'dep-1', nombre: 'Salud',     activo: true },
    { id: 'dep-2', nombre: 'Educación', activo: true },
    ]

    function renderITGestionUsuarios() {
    return render(
        <BrowserRouter>
        <ITGestionUsuarios />
        </BrowserRouter>,
    )
    }

    describe('ITGestionUsuarios', () => {
    beforeEach(() => {
        useAuthStore.setState({
        user: itUser, users: mockUsers,
        isAuthenticated: true, rememberSession: false,
        })
        useDepartamentosStore.setState({ departamentos: mockDepartamentos })
    })

    it('has no accessibility violations on initial render', async () => {
        const { container } = renderITGestionUsuarios()
        expect(await axe(container)).toHaveNoViolations()
    })
})
