import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import AlcaldeDashboard from '@/components/alcalde/AlcaldeDashboard'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { Solicitud } from '@/lib/types'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: vi.fn(),
  })
})

function renderDashboard() {
  return render(
    <BrowserRouter>
      <AlcaldeDashboard />
    </BrowserRouter>,
  )
}

const mockSolicitud: Solicitud = {
  id: '1001',
  radicado: '#1001',
  titulo: 'Solicitud de apoyo medico',
  solicitante: 'Juan Perez Garcia',
  identificacion: '12345678',
  categoria: 'salud',
  fechaSolicitud: '2024-03-15',
  fechaLimite: '2024-03-30',
  descripcion: 'Solicitud de apoyo para tratamiento medico especializado.',
  estado: 'received',
  prioridad: 'HIGH',
  subidoPor: 'Maria Garcia',
  subidoPorId: '2',
  documento: 'solicitud_1001.pdf',
  historial: [],
}

describe('AlcaldeDashboard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        nombre: 'Carlos',
        apellido: 'Rodriguez',
        username: 'carlos.rodriguez',
        role: 'alcalde',
        avatar: null,
        status: 'active',
        createdAt: '2024-01-15',
      },
      accessToken: null,
      isAuthenticated: true,
      rememberSession: false,
    })
  })

  it('renders empty state when there are no solicitudes', () => {
    useSolicitudesStore.setState({
      solicitudes: [],
    })

    renderDashboard()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /no hay datos/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText(/no hay datos/i, { selector: 'p' })).toBeInTheDocument()
  })

  it('renders dashboard when there are solicitudes', () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitud],
    })

    renderDashboard()

    expect(screen.getByRole('heading', { name: /bienvenido/i })).toBeInTheDocument()
    expect(screen.getByText('Total Solicitudes')).toBeInTheDocument()
    expect(screen.getAllByText('Pendientes').length).toBeGreaterThan(0)
    expect(screen.getByText('Aprobadas')).toBeInTheDocument()
    expect(screen.getByText('Declinadas')).toBeInTheDocument()
  })

  it('has no basic accessibility violations', async () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitud],
    })

    const { container } = renderDashboard()
    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })
})
