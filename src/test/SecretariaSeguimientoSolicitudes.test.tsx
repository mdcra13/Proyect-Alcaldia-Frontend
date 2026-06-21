import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import SeguimientoSolicitudes from '@/components/secretaria/SeguimientoSolicitudes'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { Solicitud } from '@/lib/types'

function renderSeguimientoSolicitudes() {
  return render(
    <BrowserRouter>
      <SeguimientoSolicitudes />
    </BrowserRouter>,
  )
}

const mockSolicitud: Solicitud = {
  id: '4001',
  radicado: '#4001',
  titulo: 'Solicitud de transporte escolar',
  descripcion: 'Solicitud para apoyo de transporte escolar.',
  solicitante: 'Carlos Perez',
  identificacion: '8-456-789',
  categoria: 'educacion',
  departamentoId: 'dep-2',
  departamento: {
    id: 'dep-2',
    nombre: 'Educacion',
    descripcion: 'Departamento encargado de solicitudes educativas.',
    activo: true,
  },
  fechaSolicitud: '2024-05-01',
  fechaLimite: '2024-05-20',
  estado: 'in_review',
  prioridad: 'MEDIUM',
  subidoPor: 'Maria Garcia',
  subidoPorId: '2',
  documento: 'solicitud_4001.pdf',
  motivoRechazo: null,
  historial: [
    {
      id: 'h-4001-1',
      fecha: '2024-05-01',
      accion: 'received',
      descripcion: 'Solicitud registrada por Maria Garcia',
      usuario: 'Maria Garcia',
      usuarioId: '2',
    },
  ],
}

describe('SeguimientoSolicitudes', () => {
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

  it('renders the tracking table with solicitudes', () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitud],
    })

    renderSeguimientoSolicitudes()

    expect(
      screen.getByRole('heading', { level: 2, name: /seguimiento de solicitudes/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Carlos Perez').length).toBeGreaterThan(0)
    expect(screen.getAllByText('#4001').length).toBeGreaterThan(0)
  })

  it('has no basic accessibility violations', async () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitud],
    })

    const { container } = renderSeguimientoSolicitudes()
    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })
})
