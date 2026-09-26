import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import SubirDocumento from '@/components/secretaria/SubirDocumento'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import { DocumentUploadError } from '@/lib/api/backend'
import { getTodayPanama } from '@/lib/utils'
import type { Solicitud } from '@/lib/types'

const secretariaUser = {
  id: 'sec-1',
  nombre: 'María',
  apellido: 'García',
  username: 'maria.sec@alcaldia.gov.co',
  role: 'secretaria' as const,
  avatar: null,
  status: 'active' as const,
  createdAt: '2024-02-01',
}

describe('QA Findings: SubirDocumento - Dates & Upload Failure Retry', () => {
  const today = getTodayPanama()

  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({
      user: secretariaUser,
      isAuthenticated: true,
      rememberSession: false,
    })
    useDepartamentosStore.setState({
      departamentos: [
        { id: 'dep-1', nombre: 'Salud', activo: true },
      ],
    })
    useSolicitudesStore.setState({
      solicitudes: [],
    })
  })

  it('enforces date constraints on fechaSolicitud (max today) and fechaLimite (min today)', () => {
    render(
      <BrowserRouter>
        <SubirDocumento />
      </BrowserRouter>
    )

    const fechaSolicitudInput = screen.getByLabelText(/fecha de la solicitud/i) as HTMLInputElement
    const fechaLimiteInput = screen.getByLabelText(/fecha límite/i) as HTMLInputElement

    expect(fechaSolicitudInput).toHaveAttribute('max', today)
    expect(fechaLimiteInput).toHaveAttribute('min', today)
  })

  it('displays radicado and allows retrying document upload without duplicating request if upload fails', async () => {
    const mockAddSolicitud = vi.fn().mockRejectedValue(
      new DocumentUploadError('Network error uploading file', 'req-999', 'RAD-2026-999')
    )
    const mockRetryUpload = vi.fn().mockResolvedValue({
      id: 'req-999',
      radicado: 'RAD-2026-999',
      titulo: 'Solicitud médica urgente',
      descripcion: 'Detalle',
      solicitante: 'Carlos Pérez',
      identificacion: '12345678',
      categoria: 'salud',
      departamentoId: 'dep-1',
      fechaSolicitud: today,
      fechaLimite: today,
      estado: 'received',
      prioridad: 'HIGH',
      subidoPor: 'María García',
      subidoPorId: 'sec-1',
      documento: 'test.pdf',
      motivoRechazo: null,
      historial: [],
      anotaciones: [],
    } as Solicitud)

    useSolicitudesStore.setState({
      addSolicitud: mockAddSolicitud,
      retryUploadDocument: mockRetryUpload,
    })

    render(
      <BrowserRouter>
        <SubirDocumento />
      </BrowserRouter>
    )

    // Fill form
    fireEvent.change(screen.getByLabelText(/identificador/i), {
      target: { value: 'Solicitud médica urgente' },
    })
    fireEvent.change(screen.getByLabelText(/categoría/i), {
      target: { value: 'salud' },
    })
    fireEvent.change(screen.getByLabelText(/departamento/i), {
      target: { value: 'dep-1' },
    })
    fireEvent.change(screen.getByLabelText(/prioridad/i), {
      target: { value: 'HIGH' },
    })
    fireEvent.change(screen.getByLabelText(/nombre del solicitante/i), {
      target: { value: 'Carlos Pérez' },
    })

    // Attach file
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submit form -> first attempt fails on upload
    fireEvent.click(screen.getByRole('button', { name: /registrar solicitud/i }))

    // Expect radicado to be displayed
    await waitFor(() => {
      expect(screen.getAllByText(/RAD-2026-999/).length).toBeGreaterThan(0)
    })
    expect(screen.getByText(/Solicitud creada pendiente de adjuntar documento/i)).toBeInTheDocument()

    // Submit button should now say "Reintentar subida de documento"
    const retryButton = screen.getByRole('button', { name: /reintentar subida de documento/i })
    expect(retryButton).toBeInTheDocument()

    // Click retry
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(mockRetryUpload).toHaveBeenCalledWith('req-999', file, 'María García')
    })
    // addSolicitud was NOT called again (no duplicate request!)
    expect(mockAddSolicitud).toHaveBeenCalledTimes(1)

    // Success screen should be displayed
    await waitFor(() => {
      expect(screen.getByText(/Solicitud Registrada/i)).toBeInTheDocument()
      expect(screen.getByText(/Código de seguimiento: RAD-2026-999/i)).toBeInTheDocument()
    })
  })
})
