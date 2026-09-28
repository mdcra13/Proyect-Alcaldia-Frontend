import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
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

const mockSolicitudAlcalde: Solicitud = {
  id: '1001',
  radicado: '#1001',
  titulo: 'Solicitud de apoyo médico',
  descripcion: 'Solicitud de apoyo para tratamiento médico especializado.',
  solicitante: 'Juan Pérez García',
  identificacion: '12345678',
  categoria: 'salud',
  departamentoId: 'dep-1',
  departamento: {
    id: 'dep-1',
    nombre: 'Salud',
    descripcion: 'Departamento encargado de solicitudes relacionadas con salud.',
    activo: true,
  },
  fechaSolicitud: '2024-03-15',
  fechaLimite: '2024-03-25',
  estado: 'awaiting_mayor_signature',
  prioridad: 'HIGH',
  subidoPor: 'María García',
  subidoPorId: '2',
  documento: 'solicitud_1001.pdf',
  motivoRechazo: null,
  historial: [
    {
      id: 'h-1001-1',
      fecha: '2024-03-15',
      accion: 'received',
      descripcion: 'Solicitud registrada por María García',
      usuario: 'María García',
      usuarioId: '2',
    },
  ],
  anotaciones: []
}

const mockSolicitudDepartamento: Solicitud = {
  ...mockSolicitudAlcalde,
  id: '1002',
  radicado: '#1002',
  titulo: 'Solicitud todavía en departamento',
  estado: 'in_review',
}

describe('AlcaldeDashboard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        username: 'alcalde',
        role: 'alcalde',
        avatar: null,
        status: 'active',
        createdAt: '2024-01-15',
      },
      isAuthenticated: true,
      rememberSession: false,
    })

    useSolicitudesStore.setState({
      solicitudes: [],
    })
  })

  it('renders empty urgent notes state when there are no solicitudes for mayor', () => {
    renderDashboard()

    expect(
      screen.getByRole('heading', { name: /panel del alcalde/i }),
    ).toBeInTheDocument()

    expect(screen.getByText(/no hay notas pendientes de firma/i)).toBeInTheDocument()
  })

  it('renders dashboard metrics using only mayor visible solicitudes', () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudAlcalde, mockSolicitudDepartamento],
    })

    renderDashboard()

    expect(
      screen.getByRole('heading', { name: /panel del alcalde/i }),
    ).toBeInTheDocument()

    expect(screen.getByText(/total notas/i)).toBeInTheDocument()
    expect(screen.getAllByText(/pendientes de firma/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/firmadas/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/devueltas/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/cerradas/i).length).toBeGreaterThan(0)

    expect(screen.getByText('Solicitud de apoyo médico')).toBeInTheDocument()
    expect(screen.queryByText('Solicitud todavía en departamento')).not.toBeInTheDocument()
  })

  it('renders urgent notes list when there are solicitudes awaiting mayor signature', () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudAlcalde],
    })

    renderDashboard()

    expect(screen.getByText('Solicitud de apoyo médico')).toBeInTheDocument()
    expect(screen.getByText('#1001')).toBeInTheDocument()
    expect(screen.getAllByText('Salud').length).toBeGreaterThan(0)
  })

  it('has no basic accessibility violations', async () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudAlcalde],
    })

    const { container } = renderDashboard()
    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })
})
