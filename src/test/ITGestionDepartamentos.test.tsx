import 'vitest-axe/extend-expect'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { axe } from 'vitest-axe'
import ITGestionDepartamentos from '@/components/it/ITGestionDepartamentos'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { Departamento, User } from '@/lib/types'

const itUser: User = {
    id: '10', nombre: 'Carlos', apellido: 'Méndez', username: 'it.admin',
    role: 'it', avatar: null, status: 'active', createdAt: '2024-01-10',
    }

    const mockDepartamentos: Departamento[] = [
    { id: 'dep-1', nombre: 'Salud',     descripcion: 'Área de salud pública', activo: true },
    { id: 'dep-2', nombre: 'Educación', descripcion: 'Área educativa',        activo: false },
    ]

    const mockUsers: User[] = [
    itUser,
    {
        id: '3', nombre: 'Juan', apellido: 'Hernández', username: 'dep.salud',
        role: 'departamento', departamentoId: 'dep-1',
        avatar: null, status: 'active', createdAt: '2024-02-01',
    },
    ]

    function renderITGestionDepartamentos() {
    return render(
        <BrowserRouter>
        <ITGestionDepartamentos />
        </BrowserRouter>,
    )
    }

    describe('ITGestionDepartamentos', () => {
    beforeEach(() => {
        useAuthStore.setState({ user: itUser, users: mockUsers, isAuthenticated: true, rememberSession: false })
        useDepartamentosStore.setState({ departamentos: mockDepartamentos })
    })

    it('has no accessibility violations on initial render', async () => {
        const { container } = renderITGestionDepartamentos()
        expect(await axe(container)).toHaveNoViolations()
    })
})
