import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import NotasPendientes from '@/components/departamento/NotasPendientes'
import SeguimientoSolicitudes from '@/components/secretaria/SeguimientoSolicitudes'
import { CambiarDepartamentoModal } from '@/components/shared/CambiarDepartamentoModal'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { Solicitud, User } from '@/lib/types'

const deptoUser: User = {
  id: 'user-dep',
  nombre: 'Juan',
  apellido: 'Salud',
  username: 'juan.salud@alcaldia.gov.co',
  role: 'departamento',
  departamentoId: 'dep-1',
  departamento: { id: 'dep-1', nombre: 'Salud', activo: true },
  avatar: null,
  status: 'active',
  createdAt: '2026-01-01',
}

const itUser: User = {
  id: 'user-it',
  nombre: 'Carlos',
  apellido: 'Admin',
  username: 'carlos.it@alcaldia.gov.co',
  role: 'it',
  avatar: null,
  status: 'active',
  createdAt: '2026-01-01',
}

const returnedSolicitud: Solicitud = {
  id: 'sol-returned',
  radicado: '#RAD-CORRECCION-01',
  titulo: 'Nota devuelta para corrección',
  descripcion: 'Requiere adjuntar certificado médico actualizado',
  solicitante: 'Ana Martínez',
  identificacion: '99887766',
  categoria: 'salud',
  departamentoId: 'dep-1',
  departamento: { id: 'dep-1', nombre: 'Salud', activo: true },
  fechaSolicitud: '2026-03-01',
  fechaLimite: '2026-03-20',
  estado: 'returned_to_department',
  prioridad: 'HIGH',
  subidoPor: 'María Secretaria',
  subidoPorId: 'sec-1',
  documento: 'doc_v1.pdf',
  motivoRechazo: 'Falta sello oficial en certificado',
  historial: [],
  anotaciones: [],
}

describe('QA Findings: Reenviar a Alcaldía & Seguimiento IT & Cambiar Departamento', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({
      user: deptoUser,
      isAuthenticated: true,
      rememberSession: false,
    })
    useDepartamentosStore.setState({
      departamentos: [
        { id: 'dep-1', nombre: 'Salud', activo: true },
        { id: 'dep-2', nombre: 'Educación', activo: true },
      ],
    })
    useSolicitudesStore.setState({
      solicitudes: [returnedSolicitud],
    })
  })

  it('in Reenviar a Alcaldía, Cancelar works without selecting a file, and Reenviar requires a file', async () => {
    render(
      <BrowserRouter>
        <NotasPendientes />
      </BrowserRouter>
    )

    // Open detail modal first
    const detailBtn = screen.getByRole('button', { name: 'Ver detalle de #RAD-CORRECCION-01' })
    fireEvent.click(detailBtn)

    // In DocumentPreviewModal, click approve/reenviar button
    const actionBtn = screen.getByRole('button', { name: 'Reenviar a Alcaldía' })
    fireEvent.click(actionBtn)

    // Modal title should indicate corrections
    expect(screen.getByRole('heading', { name: 'Reenviar solicitud corregida' })).toBeInTheDocument()

    // Submit button "Reenviar a Alcaldía" must be disabled initially (no file selected)
    const reenviarBtn = screen.getByRole('button', { name: 'Reenviar a Alcaldía' })
    expect(reenviarBtn).toBeDisabled()

    // Cancel button must be enabled even without selecting a file
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' })
    expect(cancelBtn).toBeEnabled()

    // Click cancel -> modal should close without error
    fireEvent.click(cancelBtn)
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Reenviar solicitud corregida' })).not.toBeInTheDocument()
    })
  })

  it('in Seguimiento, IT admin cannot see "Cambiar departamento" button but can see list, detail and history', () => {
    useAuthStore.setState({
      user: itUser,
      isAuthenticated: true,
      rememberSession: false,
    })

    render(
      <BrowserRouter>
        <SeguimientoSolicitudes />
      </BrowserRouter>
    )

    // List item is visible (check table and card instances)
    expect(screen.getAllByText('#RAD-CORRECCION-01').length).toBeGreaterThan(0)

    // Detail button is present
    expect(screen.getAllByRole('button', { name: 'Ver detalle de #RAD-CORRECCION-01' }).length).toBeGreaterThan(0)

    // History button is present
    expect(screen.getAllByRole('button', { name: 'Ver historial de #RAD-CORRECCION-01' }).length).toBeGreaterThan(0)

    // Change department button must NOT be present for IT
    expect(screen.queryByRole('button', { name: /cambiar departamento de/i })).not.toBeInTheDocument()
  })

  it('CambiarDepartamentoModal retains modal and displays error message if API fails', async () => {
    const mockCambiarDepto = vi.fn().mockRejectedValue(new Error('El departamento seleccionado no tiene funcionarios activos.'))
    useSolicitudesStore.setState({
      cambiarDepartamento: mockCambiarDepto,
    })

    const onOpenChange = vi.fn()

    render(
      <CambiarDepartamentoModal
        open={true}
        onOpenChange={onOpenChange}
        solicitud={returnedSolicitud}
      />
    )

    // Select another department
    const select = screen.getByLabelText('Nuevo departamento')
    fireEvent.change(select, { target: { value: 'dep-2' } })

    // Click confirm
    const submitBtn = screen.getByRole('button', { name: /confirmar cambio/i })
    fireEvent.click(submitBtn)

    // Modal must NOT close
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    // Error message must be rendered inside modal
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'El departamento seleccionado no tiene funcionarios activos.'
      )
    })
  })
})
