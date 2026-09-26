import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import ITGestionUsuarios from '@/components/it/ITGestionUsuarios'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { User } from '@/lib/types'

const loggedInAdmin: User = {
  id: 'admin-it-1',
  nombre: 'Carlos',
  apellido: 'Méndez',
  username: 'carlos.admin',
  role: 'it',
  avatar: null,
  status: 'active',
  createdAt: '2026-01-01',
}

const mockUsers: User[] = [
  loggedInAdmin,
  {
    id: 'user-sec-2',
    nombre: 'Ana',
    apellido: 'García',
    username: 'ana.secretaria',
    role: 'secretaria',
    avatar: null,
    status: 'active',
    createdAt: '2026-01-02',
  },
  {
    id: 'user-it-3',
    nombre: 'María',
    apellido: 'López',
    username: 'maria.it',
    role: 'it',
    avatar: null,
    status: 'inactive',
    createdAt: '2026-01-03',
  },
  {
    id: 'user-dep-4',
    nombre: 'Juan',
    apellido: 'Hernández',
    username: 'juan.depto',
    role: 'departamento',
    departamentoId: 'dep-1',
    avatar: null,
    status: 'active',
    createdAt: '2026-01-04',
  },
]

describe('QA Findings: ITGestionUsuarios - Self Deactivation & Filters', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: loggedInAdmin,
      users: mockUsers,
      isAuthenticated: true,
      rememberSession: false,
    })
    useDepartamentosStore.setState({
      departamentos: [
        { id: 'dep-1', nombre: 'Salud', activo: true },
        { id: 'dep-2', nombre: 'Educación', activo: true },
      ],
    })
  })

  const renderITGestionUsuarios = () => {
    return render(
      <BrowserRouter>
        <ITGestionUsuarios />
      </BrowserRouter>
    )
  }

  it('disables the deactivate button for the logged-in admin and explains why', () => {
    renderITGestionUsuarios()

    const adminToggleBtn = screen.getByRole('button', {
      name: `No puedes desactivarte a ti mismo (${loggedInAdmin.username})`,
    })
    expect(adminToggleBtn).toBeDisabled()
    expect(adminToggleBtn).toHaveAttribute(
      'title',
      'Un administrador no puede desactivarse a sí mismo'
    )

    // Other users' toggle buttons must be enabled
    const anaToggleBtn = screen.getByRole('button', {
      name: `Desactivar ${mockUsers[1].username}`,
    })
    expect(anaToggleBtn).toBeEnabled()
  })

  it('filters by status: Todos, Activos, and Inactivos', () => {
    renderITGestionUsuarios()

    const statusFilter = screen.getByLabelText('Filtrar por estado') as HTMLSelectElement
    expect(statusFilter).toBeInTheDocument()

    const table = screen.getByRole('table')

    // Initially "todos" -> 4 users visible
    expect(within(table).getByText('Carlos Méndez')).toBeInTheDocument()
    expect(within(table).getByText('Ana García')).toBeInTheDocument()
    expect(within(table).getByText('María López')).toBeInTheDocument()
    expect(within(table).getByText('Juan Hernández')).toBeInTheDocument()

    // Filter by "active" -> María López (inactive) should disappear
    fireEvent.change(statusFilter, { target: { value: 'active' } })
    expect(within(table).getByText('Carlos Méndez')).toBeInTheDocument()
    expect(within(table).getByText('Ana García')).toBeInTheDocument()
    expect(within(table).queryByText('María López')).not.toBeInTheDocument()
    expect(within(table).getByText('Juan Hernández')).toBeInTheDocument()

    // Filter by "inactive" -> only María López should be visible
    fireEvent.change(statusFilter, { target: { value: 'inactive' } })
    expect(within(table).queryByText('Carlos Méndez')).not.toBeInTheDocument()
    expect(within(table).queryByText('Ana García')).not.toBeInTheDocument()
    expect(within(table).getByText('María López')).toBeInTheDocument()
    expect(within(table).queryByText('Juan Hernández')).not.toBeInTheDocument()
  })

  it('combines status filter with role filter and search query', () => {
    renderITGestionUsuarios()

    const searchInput = screen.getByLabelText('Buscar usuarios')
    const roleFilter = screen.getByLabelText('Filtrar por rol')
    const statusFilter = screen.getByLabelText('Filtrar por estado')

    // Filter active + role 'departamento'
    fireEvent.change(statusFilter, { target: { value: 'active' } })
    fireEvent.change(roleFilter, { target: { value: 'departamento' } })

    const table = screen.getByRole('table')

    expect(within(table).getByText('Juan Hernández')).toBeInTheDocument()
    expect(within(table).queryByText('Carlos Méndez')).not.toBeInTheDocument()
    expect(within(table).queryByText('Ana García')).not.toBeInTheDocument()
    expect(within(table).queryByText('María López')).not.toBeInTheDocument()

    // Type search that doesn't match
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } })
    expect(screen.getByText('No se encontraron usuarios.')).toBeInTheDocument()

    // Type search that matches Juan
    fireEvent.change(searchInput, { target: { value: 'Hernández' } })
    expect(within(table).getByText('Juan Hernández')).toBeInTheDocument()
  })
})
