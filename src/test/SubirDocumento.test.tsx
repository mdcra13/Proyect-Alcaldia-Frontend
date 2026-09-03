import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { axe } from 'vitest-axe'
import SubirDocumento from '@/components/secretaria/SubirDocumento'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'

function renderSubirDocumento() {
  return render(
    <BrowserRouter>
      <SubirDocumento />
    </BrowserRouter>,
  )
}

describe('SubirDocumento', () => {
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

    useSolicitudesStore.setState({
      solicitudes: [],
    })
  })

  it('renders the request registration form', () => {
    renderSubirDocumento()

    expect(
      screen.getByRole('heading', { level: 2, name: /registrar nueva solicitud/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /identificador/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrar solicitud/i })).toBeInTheDocument()
  })

  it('has no basic accessibility violations', async () => {
    const { container } = renderSubirDocumento()
    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })
})
