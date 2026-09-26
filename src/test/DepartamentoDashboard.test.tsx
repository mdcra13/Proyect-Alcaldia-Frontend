import 'vitest-axe/extend-expect'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { axe } from 'vitest-axe'
import DepartamentoDashboard from '@/components/departamento/DepartamentoDashboard'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { Solicitud, User } from '@/lib/types'

const departamentoUser: User = {
  id: '3',
  nombre: 'Juan',
  apellido: 'Hernández',
  username: 'departamento',
  role: 'departamento',
  departamentoId: 'dep-1',
  departamento: { id: 'dep-1', nombre: 'Salud', activo: true },
  avatar: null,
  status: 'active',
  createdAt: '2024-02-15',
}

const solicitudDepartamento: Solicitud = {
  id: '1001',
  radicado: '#1001',
  titulo: 'Solicitud de apoyo médico',
  descripcion: 'Solicitud de apoyo para tratamiento médico especializado.',
  solicitante: 'Juan Pérez García',
  identificacion: '8-123-456',
  categoria: 'salud',
  departamentoId: 'dep-1',
  departamento: { id: 'dep-1', nombre: 'Salud', activo: true },
  fechaSolicitud: '2024-03-15',
  fechaLimite: '2024-03-25',
  estado: 'assigned_to_department',
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

function renderDepartamentoDashboard() {
  return render(
    <BrowserRouter>
      <DepartamentoDashboard />
    </BrowserRouter>,
  )
}

describe('DepartamentoDashboard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: departamentoUser,
      isAuthenticated: true,
      rememberSession: false,
    })
    useSolicitudesStore.setState({
      solicitudes: [solicitudDepartamento],
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = renderDepartamentoDashboard()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
