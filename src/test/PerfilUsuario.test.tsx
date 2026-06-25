import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import PerfilUsuario from '@/components/shared/PerfilUsuario'
import useAuthStore from '@/lib/stores/authStore'

function renderPerfilUsuario() {
  return render(
    <BrowserRouter>
      <PerfilUsuario />
    </BrowserRouter>,
  )
}

describe('PerfilUsuario', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '2',
        nombre: 'Maria',
        apellido: 'Garcia',
        username: 'secretaria',
        role: 'secretaria',
        avatar: null,
        status: 'active',
        createdAt: '2024-02-01',
      },
      isAuthenticated: true,
      rememberSession: false,
    })
  })

  it('renders the current user profile data form', () => {
    renderPerfilUsuario()

    expect(screen.getByRole('heading', { level: 2, name: /mi perfil/i })).toBeInTheDocument()
    expect(screen.getByText(/mis datos/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /nombre/i })).toHaveValue('Maria')
    expect(screen.getByRole('textbox', { name: /apellido/i })).toHaveValue('Garcia')
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
  })

  it('has no basic accessibility violations', async () => {
    const { container } = renderPerfilUsuario()
    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })
})
