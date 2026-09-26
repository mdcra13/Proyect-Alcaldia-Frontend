import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import ITGestionUsuarios from '@/components/it/ITGestionUsuarios'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { Departamento, User } from '@/lib/types'

const itAdmin: User = {
  id: 'admin-10',
  nombre: 'Carlos',
  apellido: 'Méndez',
  username: 'it.admin@alcaldia.gov.co',
  role: 'it',
  avatar: null,
  status: 'active',
  createdAt: '2024-01-10',
}

const mockUsers: User[] = [
  itAdmin,
  {
    id: 'user-1',
    nombre: 'Ana',
    apellido: 'García',
    username: 'ana.alcalde@alcaldia.gov.co',
    role: 'alcalde',
    avatar: null,
    status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'user-2',
    nombre: 'María',
    apellido: 'López',
    username: 'maria.sec@alcaldia.gov.co',
    role: 'secretaria',
    avatar: null,
    status: 'inactive',
    createdAt: '2024-01-02',
  },
  {
    id: 'user-3',
    nombre: 'Juan',
    apellido: 'Hernández',
    username: 'juan.salud@alcaldia.gov.co',
    role: 'departamento',
    departamentoId: 'dep-1',
    avatar: null,
    status: 'active',
    createdAt: '2024-02-01',
  },
]

const mockDepartamentos: Departamento[] = [
  { id: 'dep-1', nombre: 'Salud', activo: true },
  { id: 'dep-2', nombre: 'Educación', activo: true },
]

function renderITGestionUsuarios() {
  return render(
    <BrowserRouter>
      <ITGestionUsuarios />
    </BrowserRouter>,
  )
}

describe('QA Findings: ITGestionUsuarios - Self Deactivation & Filters', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: itAdmin,
      users: mockUsers,
      isAuthenticated: true,
      rememberSession: false,
    })
    useDepartamentosStore.setState({ departamentos: mockDepartamentos })
  })

  it('disables the deactivate button for the logged-in admin and explains why', () => {
    renderITGestionUsuarios()

    // Find the toggle button for admin-10
    const adminToggleBtn = screen.getByRole('button', {
      name: `No puedes desactivarte a ti mismo (${itAdmin.username})`,
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

    // Initially "todos" -> 4 users visible
    expect(screen.getByText('Carlos Méndez')).toBeInTheDocument()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
    expect(screen.getByText('Juan Hernández')).toBeInTheDocument()

    // Filter by "active" -> María López (inactive) should disappear
    fireEvent.change(statusFilter, { target: { value: 'active' } })
    expect(screen.getByText('Carlos Méndez')).toBeInTheDocument()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.queryByText('María López')).not.toBeInTheDocument()
    expect(screen.getByText('Juan Hernández')).toBeInTheDocument()

    // Filter by "inactive" -> only María López should be visible
    fireEvent.change(statusFilter, { target: { value: 'inactive' } })
    expect(screen.queryByText('Carlos Méndez')).not.toBeInTheDocument()
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
    expect(screen.queryByText('Juan Hernández')).not.toBeInTheDocument()
  })

  it('combines status filter with role filter and search query', () => {
    renderITGestionUsuarios()

    const searchInput = screen.getByLabelText('Buscar usuarios')
    const roleFilter = screen.getByLabelText('Filtrar por rol')
    const statusFilter = screen.getByLabelText('Filtrar por estado')

    // Filter active + role 'departamento'
    fireEvent.change(statusFilter, { target: { value: 'active' } })
    fireEvent.change(roleFilter, { target: { value: 'departamento' } })

    expect(screen.getByText('Juan Hernández')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Méndez')).not.toBeInTheDocument()
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument()
    expect(screen.queryByText('María López')).not.toBeInTheDocument()

    // Type search that doesn't match
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } })
    expect(screen.getByText('No se encontraron usuarios.')).toBeInTheDocument()

    // Type search that matches Juan
    fireEvent.change(searchInput, { target: { value: 'Hernández' } })
    expect(screen.getByText('Juan Hernández')).toBeInTheDocument()
  })
})
