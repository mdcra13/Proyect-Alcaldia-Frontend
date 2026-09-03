import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import SecretariaNotas from '@/components/secretaria/SecretariaNotas'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { Solicitud } from '@/lib/types'

function renderSecretariaNotas() {
  return render(
    <BrowserRouter>
      <SecretariaNotas />
    </BrowserRouter>,
  )
}

const mockSolicitudSecretaria: Solicitud = {
  id: '3001',
  radicado: '#3001',
  titulo: 'Solicitud de medicamentos',
  descripcion: 'Solicitud de apoyo para medicamentos especializados.',
  solicitante: 'Rosa Martinez',
  identificacion: '8-123-456',
  categoria: 'salud',
  departamentoId: 'dep-1',
  departamento: {
    id: 'dep-1',
    nombre: 'Salud',
    descripcion: 'Departamento encargado de solicitudes de salud.',
    activo: true,
  },
  fechaSolicitud: '2024-04-01',
  fechaLimite: '2024-04-15',
  estado: 'assigned_to_department',
  prioridad: 'HIGH',
  subidoPor: 'Maria Garcia',
  subidoPorId: '2',
  documento: 'solicitud_3001.pdf',
  motivoRechazo: null,
  historial: [
    {
      id: 'h-3001-1',
      fecha: '2024-04-01',
      accion: 'received',
      descripcion: 'Solicitud registrada por Maria Garcia',
      usuario: 'Maria Garcia',
      usuarioId: '2',
    },
  ],
  anotaciones: []
}

const mockSolicitudOtroUsuario: Solicitud = {
  ...mockSolicitudSecretaria,
  id: '3002',
  radicado: '#3002',
  titulo: 'Solicitud de otro usuario',
  subidoPorId: '99',
}

describe('SecretariaNotas', () => {
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

  it('renders only notes uploaded by the current secretaria', () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudSecretaria, mockSolicitudOtroUsuario],
    })

    renderSecretariaNotas()

    expect(screen.getAllByRole('heading', { name: /mis notas/i }).length).toBeGreaterThan(0)
    expect(screen.getByText('Solicitud de medicamentos')).toBeInTheDocument()
    expect(screen.getByText('#3001')).toBeInTheDocument()
    expect(screen.queryByText('Solicitud de otro usuario')).not.toBeInTheDocument()
  })

  it('has no basic accessibility violations', async () => {
    useSolicitudesStore.setState({
      solicitudes: [mockSolicitudSecretaria],
    })

    const { container } = renderSecretariaNotas()
    const results = await axe(container)

    expect(results.violations).toHaveLength(0)
  })
})
