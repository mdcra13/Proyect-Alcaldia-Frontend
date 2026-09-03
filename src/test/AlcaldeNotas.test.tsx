import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { axe } from 'vitest-axe'
import AlcaldeNotas from '@/components/alcalde/AlcaldeNotas'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { Solicitud } from '@/lib/types'

function renderAlcaldeNotas() {
  return render(
    <BrowserRouter>
      <AlcaldeNotas />
    </BrowserRouter>,
  )
}

const mockSolicitudAlcalde: Solicitud = {
  id: '5001',
  radicado: '#5001',
  titulo: 'Solicitud de apoyo medico',
  descripcion: 'Solicitud de apoyo para tratamiento medico especializado.',
  solicitante: 'Juan Perez',
  identificacion: '8-123-456',
  categoria: 'salud',
  departamentoId: 'dep-1',
  departamento: {
    id: 'dep-1',
    nombre: 'Salud',
    descripcion: 'Departamento encargado de solicitudes de salud.',
    activo: true,
  },
  fechaSolicitud: '2024-06-01',
  fechaLimite: '2024-06-15',
  estado: 'awaiting_mayor_signature',
  prioridad: 'HIGH',
  subidoPor: 'Maria Garcia',
  subidoPorId: '2',
  documento: 'solicitud_5001.pdf',
  motivoRechazo: null,
  historial: [
    {
      id: 'h-5001-1',
      fecha: '2024-06-01',
      accion: 'received',
      descripcion: 'Solicitud registrada por Maria Garcia',
      usuario: 'Maria Garcia',
      usuarioId: '2',
    },
  ],
  anotaciones: []
}

const mockSolicitudNoVisible: Solicitud = {
  ...mockSolicitudAlcalde,
  id: '5002',
  radicado: '#5002',
  titulo: 'Solicitud en departamento',
  estado: 'in_review',
}

describe('AlcaldeNotas', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        nombre: 'Carlos',
        apellido: 'Rodriguez',
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

  it('renders only notes visible to the mayor', () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudAlcalde, mockSolicitudNoVisible],
    })

    renderAlcaldeNotas()

    expect(
    screen.getByRole('heading', {
      level: 1,
      name: /listado de notas/i,
    }),
  ).toBeInTheDocument()

    expect(screen.getByText('Solicitud de apoyo medico')).toBeInTheDocument()
    expect(screen.getByText('#5001')).toBeInTheDocument()
    expect(screen.queryByText('Solicitud en departamento')).not.toBeInTheDocument()
  })

  it('has no basic accessibility violations', async () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudAlcalde],
    })

    const { container } = renderAlcaldeNotas()
    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })

  it('separates rejection from requesting changes', () => {
    useSolicitudesStore.setState({ solicitudes: [mockSolicitudAlcalde] })
    renderAlcaldeNotas()

    expect(screen.getByRole('button', { name: 'Aprobar #5001' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Firmar #5001' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Rechazar #5001' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Solicitar cambios para #5001' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar #5001' }))
    expect(screen.getByRole('heading', { name: 'Rechazar Solicitud' })).toBeInTheDocument()
    expect(screen.getAllByText('Rechazada por Alcaldía')).toHaveLength(2)
  })

  it('opens the change request flow independently', () => {
    useSolicitudesStore.setState({ solicitudes: [mockSolicitudAlcalde] })
    renderAlcaldeNotas()

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar cambios para #5001' }))
    expect(
      screen.getByRole('heading', { name: 'Solicitar cambios al departamento' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Devuelta a departamento')).toBeInTheDocument()
  })
})
