import { beforeEach, describe, expect, it } from 'vitest'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import type { Solicitud } from '@/lib/types'

const baseSolicitud: Solicitud = {
  id: 'vista-1',
  radicado: '#VISTA-1',
  titulo: 'Solicitud para registrar vistas',
  descripcion: 'Solicitud usada para probar el registro de vistas.',
  solicitante: 'Ana Perez',
  identificacion: '8-123-456',
  categoria: 'salud',
  departamentoId: 'dep-1',
  departamento: {
    id: 'dep-1',
    nombre: 'Salud',
    activo: true,
  },
  fechaSolicitud: '2024-07-01',
  fechaLimite: '2024-07-15',
  estado: 'assigned_to_department',
  prioridad: 'MEDIUM',
  subidoPor: 'Maria Garcia',
  subidoPorId: '2',
  documento: 'solicitud.pdf',
  motivoRechazo: null,
  historial: [
    {
      id: 'h-vista-1',
      fecha: '2024-07-01',
      accion: 'received',
      descripcion: 'Solicitud registrada por Maria Garcia',
      usuario: 'Maria Garcia',
      usuarioId: '2',
    },
  ],
  anotaciones: []
}

describe('solicitudesStore registrarVista', () => {
  beforeEach(() => {
    useSolicitudesStore.setState({
      solicitudes: [baseSolicitud],
    })
  })

  it('registers the first time a user views a note', () => {
    const updatedSolicitud = useSolicitudesStore
      .getState()
      .registrarVista('vista-1', '3', 'Juan Hernandez')

    expect(updatedSolicitud?.historial).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accion: 'assigned_to_department',
          descripcion: 'Documento revisado por Juan Hernandez',
          usuario: 'Juan Hernandez',
          usuarioId: '3',
        }),
      ]),
    )
  })

  it('does not duplicate viewed history for the same user', () => {
    const store = useSolicitudesStore.getState()

    store.registrarVista('vista-1', '3', 'Juan Hernandez')
    store.registrarVista('vista-1', '3', 'Juan Hernandez')

    const viewedEntries = useSolicitudesStore
    .getState()
    .getSolicitudById('vista-1')
    ?.historial.filter(entry => entry.descripcion === 'Documento revisado por Juan Hernandez' && entry.usuarioId === '3')
    expect(viewedEntries).toHaveLength(1)
  })

  it('registers independent first views for different users', () => {
    const store = useSolicitudesStore.getState()

    store.registrarVista('vista-1', '3', 'Juan Hernandez')
    store.registrarVista('vista-1', '1', 'Carlos Rodriguez')

    const viewedEntries = useSolicitudesStore
    .getState().getSolicitudById('vista-1')?.historial.filter(entry => entry.descripcion.startsWith('Documento revisado por'))

    expect(viewedEntries).toHaveLength(2)
  })
})
