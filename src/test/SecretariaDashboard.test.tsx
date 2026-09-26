import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { axe } from 'vitest-axe'
import { SecretariaDashboard } from '@/components/secretaria/SecretariaDashboard'
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
})

function renderDashboard() {
  return render(
    <BrowserRouter>
      <SecretariaDashboard />
    </BrowserRouter>,
  )
}

const mockSolicitudSecretaria: Solicitud = {
  id: '2001',
  radicado: '#2001',
  titulo: 'Solicitud de apoyo escolar',
  descripcion: 'Solicitud de apoyo para compra de utiles escolares.',
  solicitante: 'Ana Perez',
  identificacion: '8-123-456',
  categoria: 'educacion',
  departamentoId: 'dep-2',
  departamento: {
    id: 'dep-2',
    nombre: 'Educacion',
    descripcion: 'Departamento encargado de solicitudes educativas.',
    activo: true,
  },
  fechaSolicitud: '2024-03-10',
  fechaLimite: '2024-03-25',
  estado: 'assigned_to_department',
  prioridad: 'HIGH',
  subidoPor: 'Maria Garcia',
  subidoPorId: '2',
  documento: 'solicitud_2001.pdf',
  motivoRechazo: null,
  historial: [
    {
      id: 'h-2001-1',
      fecha: '2024-03-10',
      accion: 'received',
      descripcion: 'Solicitud registrada por Maria Garcia',
      usuario: 'Maria Garcia',
      usuarioId: '2',
    },
  ],
  anotaciones: []
}

describe('SecretariaDashboard', () => {
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

  it('renders dashboard metrics for secretaria solicitudes', () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudSecretaria],
    })

    renderDashboard()

    expect(screen.getByRole('heading', { name: /hola, maria/i })).toBeInTheDocument()
    expect(screen.getByText(/total solicitudes/i)).toBeInTheDocument()
    expect(screen.getByText('Solicitud de apoyo escolar')).toBeInTheDocument()
  })

  it('has no basic accessibility violations', async () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudSecretaria],
    })

    const { container } = renderDashboard()
    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })
})
