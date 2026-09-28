import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { axe } from 'vitest-axe'
import LoginPage from '@/components/auth/LoginPage'

function renderLoginPage() {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderLoginPage()

    expect(screen.getByRole('heading', { name: /sistema de ayuda social/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/usuario/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('has no basic accessibility violations', async () => {
    const { container } = renderLoginPage()

    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })
})
