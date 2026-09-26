import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import useAuthStore from '@/lib/stores/authStore'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import { backendApi } from '@/lib/api/backend'
import type { Solicitud, User } from '@/lib/types'

const secretariaUser: User = {
  id: 'sec-1',
  nombre: 'María',
  apellido: 'López',
  username: 'maria.sec@alcaldia.gov.co',
  role: 'secretaria',
  avatar: null,
  status: 'active',
  createdAt: '2026-01-01',
}

const itUser: User = {
  id: 'it-1',
  nombre: 'Carlos',
  apellido: 'Admin',
  username: 'carlos.it@alcaldia.gov.co',
  role: 'it',
  avatar: null,
  status: 'active',
  createdAt: '2026-01-01',
}

const solicitudConVersiones: Solicitud = {
  id: 'req-multi-doc',
  radicado: '#RAD-2026-001',
  titulo: 'Solicitud con múltiples versiones',
  descripcion: 'Revisión técnica de documentos',
  solicitante: 'Pedro Pérez',
  identificacion: '12345678',
  categoria: 'salud',
  departamentoId: 'dep-1',
  departamento: { id: 'dep-1', nombre: 'Salud', activo: true },
  fechaSolicitud: '2026-03-01',
  fechaLimite: '2026-03-30',
  estado: 'in_review',
  prioridad: 'HIGH',
  subidoPor: 'María López',
  subidoPorId: 'sec-1',
  documento: 'documento_v2.pdf',
  motivoRechazo: null,
  historial: [],
  anotaciones: [],
  documentos: [
    {
      id: 'doc-v1',
      nombre: 'archivo_inicial_v1.pdf',
      url: '/uploads/archivo_inicial_v1.pdf',
      tamano: 1024 * 1024,
      tipo: 'application/pdf',
      subidoPor: 'Pedro Pérez',
      subidoPorId: 'sec-1',
      version: 1,
      fecha: '2026-03-01T10:00:00.000Z',
      esActual: false,
    },
    {
      id: 'doc-v2',
      nombre: 'archivo_corregido_v2.pdf',
      url: '/uploads/archivo_corregido_v2.pdf',
      tamano: 2 * 1024 * 1024,
      tipo: 'application/pdf',
      subidoPor: 'Juan Salud',
      subidoPorId: 'dep-1',
      version: 2,
      fecha: '2026-03-05T12:00:00.000Z',
      esActual: true,
    },
  ],
}

describe('QA Findings: DocumentPreviewModal - Versions & IT Role Restriction & Protected Blob', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({
      user: secretariaUser,
      isAuthenticated: true,
      rememberSession: false,
    })
    vi.spyOn(backendApi, 'getDocumentBlob').mockImplementation(async (_reqId, docId) => {
      return new Blob([`mock content for ${docId}`], { type: 'application/pdf' })
    })
    useSolicitudesStore.setState({
      loadSolicitudDetails: vi.fn().mockResolvedValue(solicitudConVersiones),
    })
  })

  it('selects and switches between two distinct document versions correctly with authenticated blob', async () => {
    await act(async () => {
      render(
        <DocumentPreviewModal
          open={true}
          onClose={() => {}}
          solicitud={solicitudConVersiones}
        />
      )
    })

    // Initial state: doc-v2 is esActual = true
    await waitFor(() => {
      expect(screen.getByText('archivo_corregido_v2.pdf')).toBeInTheDocument()
      expect(screen.getByText('Versión 2 (Actual)')).toBeInTheDocument()
    })

    // Download link points to v2
    const downloadLinkV2 = screen.getByRole('link', {
      name: 'Descargar archivo_corregido_v2.pdf',
    })
    expect(downloadLinkV2).toHaveTextContent('Descargar (v2)')

    // Check version buttons
    const version1Button = screen.getByRole('button', {
      name: /versión 1: archivo_inicial_v1\.pdf/i,
    })
    const version2Button = screen.getByRole('button', {
      name: /versión 2: archivo_corregido_v2\.pdf/i,
    })

    expect(version2Button).toHaveAttribute('aria-current', 'true')
    expect(version1Button).not.toHaveAttribute('aria-current')

    // Click version 1 to view it
    await act(async () => {
      fireEvent.click(version1Button)
    })

    // Now v1 should be selected
    await waitFor(() => {
      expect(screen.getByText('archivo_inicial_v1.pdf')).toBeInTheDocument()
      expect(screen.getByText('Versión 1')).toBeInTheDocument()
      expect(version1Button).toHaveAttribute('aria-current', 'true')
      expect(version2Button).not.toHaveAttribute('aria-current')
    })

    const downloadLinkV1 = screen.getByRole('link', {
      name: 'Descargar archivo_inicial_v1.pdf',
    })
    expect(downloadLinkV1).toHaveTextContent('Descargar (v1)')
  })

  it('restricts IT admin from viewing or downloading documents and does NOT call registrarVista', async () => {
    useAuthStore.setState({
      user: itUser,
      isAuthenticated: true,
      rememberSession: false,
    })

    const registrarVistaSpy = vi.spyOn(useSolicitudesStore.getState(), 'registrarVista')

    await act(async () => {
      render(
        <DocumentPreviewModal
          open={true}
          onClose={() => {}}
          solicitud={solicitudConVersiones}
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Visualización y descarga restringidas')).toBeInTheDocument()
    })

    // registrarVista must NOT be called for IT admin
    expect(registrarVistaSpy).not.toHaveBeenCalled()

    // Download link should NOT be rendered for IT admin
    expect(screen.queryByRole('link', { name: /descargar/i })).not.toBeInTheDocument()

    // Restriction notice should be rendered
    expect(
      screen.getByText(/La visualización y descarga de documentos adjuntos no está disponible para el rol Administrador IT/i)
    ).toBeInTheDocument()

    // No embed or img should be rendered for document viewer
    expect(screen.queryByRole('img', { name: /vista previa/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('document', { name: /vista previa/i })).not.toBeInTheDocument()
  })
})
