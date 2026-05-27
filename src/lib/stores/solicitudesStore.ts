import { create } from 'zustand'
import type {
  CategoriesMap,
  Solicitud,
  SolicitudCategoria,
  SolicitudFilters,
  SolicitudPrioridad,
  SolicitudStats,
} from '@/lib/types'

export const CATEGORIES: CategoriesMap = {
  salud: {
    label: 'Salud',
    icon: '🏥',
    color: 'bg-red-100 text-red-700 border-red-200',
    iconBg: 'bg-red-500',
  },
  educacion: {
    label: 'Educación',
    icon: '🎓',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-500',
  },
  familiar: {
    label: 'Familiar',
    icon: '👨‍👩‍👧',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-500',
  },
  comunidad: {
    label: 'Comunidad',
    icon: '🏘️',
    color: 'bg-green-100 text-green-700 border-green-200',
    iconBg: 'bg-green-500',
  },
}

const mockSolicitudes: Solicitud[] = [
  {
    id: '1001',
    radicado: '#1001',
    titulo: 'Solicitud de apoyo médico',
    solicitante: 'Juan Pérez García',
    identificacion: '12345678',
    categoria: 'salud',
    fechaIngreso: '2024-03-15',
    descripcion: 'Solicitud de apoyo para tratamiento médico especializado.',
    estado: 'pendiente',
    prioridad: 'alta',
    subidoPor: 'María García',
    documento: 'solicitud_1001.pdf',
  },
  {
    id: '1002',
    radicado: '#1002',
    titulo: 'Beca escolar para hijos',
    solicitante: 'Ana María López',
    identificacion: '87654321',
    categoria: 'educacion',
    fechaIngreso: '2024-03-14',
    descripcion: 'Solicitud de beca escolar para dos hijos menores.',
    estado: 'pendiente',
    prioridad: 'media',
    subidoPor: 'María García',
    documento: 'solicitud_1002.pdf',
  },
  {
    id: '1003',
    radicado: '#1003',
    titulo: 'Ayuda alimentaria familiar',
    solicitante: 'Pedro Ramírez',
    identificacion: '11223344',
    categoria: 'familiar',
    fechaIngreso: '2024-03-13',
    descripcion: 'Solicitud de ayuda alimentaria para familia de 5 miembros.',
    estado: 'en_revision',
    prioridad: 'alta',
    subidoPor: 'Ana López',
    documento: 'solicitud_1003.pdf',
  },
  {
    id: '1004',
    radicado: '#1004',
    titulo: 'Mejoramiento vía barrial',
    solicitante: 'Comunidad Los Pinos',
    identificacion: 'N/A',
    categoria: 'comunidad',
    fechaIngreso: '2024-03-12',
    descripcion: 'Solicitud para mejoramiento de la vía principal del barrio.',
    estado: 'aprobado',
    prioridad: 'media',
    subidoPor: 'María García',
    documento: 'solicitud_1004.pdf',
    motivoRechazo: null,
  },
  {
    id: '1005',
    radicado: '#1005',
    titulo: 'Apoyo para cirugía',
    solicitante: 'Rosa Martínez',
    identificacion: '55667788',
    categoria: 'salud',
    fechaIngreso: '2024-03-11',
    descripcion: 'Solicitud de apoyo económico para cirugía de urgencia.',
    estado: 'aprobado',
    prioridad: 'alta',
    subidoPor: 'Ana López',
    documento: 'solicitud_1005.pdf',
  },
  {
    id: '1006',
    radicado: '#1006',
    titulo: 'Útiles escolares',
    solicitante: 'Carmen Sánchez',
    identificacion: '99887766',
    categoria: 'educacion',
    fechaIngreso: '2024-03-10',
    descripcion: 'Solicitud de kit de útiles escolares para 3 niños.',
    estado: 'declinado',
    prioridad: 'baja',
    subidoPor: 'María García',
    documento: 'solicitud_1006.pdf',
    motivoRechazo: 'Documentación incompleta. Se requiere certificado de estudios actualizado.',
  },
  {
    id: '1007',
    radicado: '#1007',
    titulo: 'Subsidio de vivienda',
    solicitante: 'Jorge Hernández',
    identificacion: '44332211',
    categoria: 'familiar',
    fechaIngreso: '2024-03-09',
    descripcion: 'Solicitud de subsidio para mejoramiento de vivienda.',
    estado: 'pendiente',
    prioridad: 'media',
    subidoPor: 'Ana López',
    documento: 'solicitud_1007.pdf',
  },
  {
    id: '1008',
    radicado: '#1008',
    titulo: 'Alumbrado público',
    solicitante: 'JAC Barrio Centro',
    identificacion: 'N/A',
    categoria: 'comunidad',
    fechaIngreso: '2024-03-08',
    descripcion: 'Solicitud de instalación de alumbrado público en zona oscura.',
    estado: 'pendiente',
    prioridad: 'baja',
    subidoPor: 'María García',
    documento: 'solicitud_1008.pdf',
  },
  {
    id: '1009',
    radicado: '#1009',
    titulo: 'Medicamentos especializados',
    solicitante: 'Luis Fernando Díaz',
    identificacion: '66778899',
    categoria: 'salud',
    fechaIngreso: '2024-03-07',
    descripcion: 'Solicitud de medicamentos para tratamiento crónico.',
    estado: 'en_revision',
    prioridad: 'alta',
    subidoPor: 'Ana López',
    documento: 'solicitud_1009.pdf',
  },
  {
    id: '1010',
    radicado: '#1010',
    titulo: 'Transporte escolar',
    solicitante: 'Vereda El Roble',
    identificacion: 'N/A',
    categoria: 'educacion',
    fechaIngreso: '2024-03-06',
    descripcion: 'Solicitud de ruta de transporte escolar para zona rural.',
    estado: 'aprobado',
    prioridad: 'media',
    subidoPor: 'María García',
    documento: 'solicitud_1010.pdf',
  },
]

interface NewSolicitudData {
  categoria: SolicitudCategoria
  solicitante: string
  identificacion: string
  descripcion: string
  titulo: string
  documento: string
  subidoPor: string
  prioridad?: SolicitudPrioridad
}

interface SolicitudesState {
  solicitudes: Solicitud[]
  getStats: () => SolicitudStats
  getPendientes: () => Solicitud[]
  getByStatus: (status: string) => Solicitud[]
  aprobar: (id: string) => void
  declinar: (id: string, motivo: string) => void
  addSolicitud: (solicitud: NewSolicitudData) => Solicitud
  search: (query: string, filters?: SolicitudFilters) => Solicitud[]
}

const useSolicitudesStore = create<SolicitudesState>((set, get) => ({
  solicitudes: mockSolicitudes,

  getStats: (): SolicitudStats => {
    // TODO: Replace mock stats with GET /api/v1/requests when backend is ready.
    const solicitudes = get().solicitudes

    return {
      total: solicitudes.length,
      pendientes: solicitudes.filter(
        solicitud =>
          solicitud.estado === 'pendiente' ||
          solicitud.estado === 'en_revision'
      ).length,
      aprobadas: solicitudes.filter(solicitud => solicitud.estado === 'aprobado').length,
      declinadas: solicitudes.filter(solicitud => solicitud.estado === 'declinado').length,
    }
  },

  getPendientes: (): Solicitud[] => {
    // TODO: Replace mock pending requests with GET /api/v1/requests when backend is ready.
    return get().solicitudes.filter(
      solicitud =>
        solicitud.estado === 'pendiente' ||
        solicitud.estado === 'en_revision'
    )
  },

  getByStatus: (status: string): Solicitud[] => {
    // TODO: Replace mock status filtering with GET /api/v1/requests when backend is ready.
    const solicitudes = get().solicitudes

    if (status === 'todos') return solicitudes

    if (status === 'pendientes') {
      return solicitudes.filter(
        solicitud =>
          solicitud.estado === 'pendiente' ||
          solicitud.estado === 'en_revision'
      )
    }

    return solicitudes.filter(solicitud => solicitud.estado === status)
  },

  aprobar: (id: string) => {
    // TODO: Replace mock status update with PATCH /api/v1/requests/:id/status when backend is ready.
    set(state => ({
      solicitudes: state.solicitudes.map(solicitud =>
        solicitud.id === id
          ? { ...solicitud, estado: 'aprobado' as const }
          : solicitud
      ),
    }))
  },

  declinar: (id: string, motivo: string) => {
    // TODO: Replace mock status update with PATCH /api/v1/requests/:id/status when backend is ready.
    set(state => ({
      solicitudes: state.solicitudes.map(solicitud =>
        solicitud.id === id
          ? {
              ...solicitud,
              estado: 'declinado' as const,
              motivoRechazo: motivo,
            }
          : solicitud
      ),
    }))
  },

  addSolicitud: (solicitud: NewSolicitudData): Solicitud => {
    // TODO: Replace mock creation with POST /api/v1/requests when backend is ready.
    const nextId =
      Math.max(...get().solicitudes.map(item => Number.parseInt(item.id, 10))) + 1

    const newSolicitud: Solicitud = {
      ...solicitud,
      id: String(nextId),
      radicado: `#${nextId}`,
      estado: 'pendiente',
      prioridad: solicitud.prioridad ?? 'media',
      fechaIngreso: new Date().toISOString().split('T')[0],
    }

    set(state => ({
      solicitudes: [newSolicitud, ...state.solicitudes],
    }))

    return newSolicitud
  },

  search: (query: string, filters: SolicitudFilters = {}): Solicitud[] => {
    // TODO: Replace mock search/filtering with GET /api/v1/requests when backend is ready.
    let results = get().solicitudes

    if (query) {
      const normalizedQuery = query.toLowerCase()

      results = results.filter(solicitud =>
        solicitud.solicitante.toLowerCase().includes(normalizedQuery) ||
        solicitud.radicado.toLowerCase().includes(normalizedQuery) ||
        solicitud.titulo.toLowerCase().includes(normalizedQuery)
      )
    }

    if (filters.categorias && filters.categorias.length > 0) {
      results = results.filter(solicitud =>
        filters.categorias?.includes(solicitud.categoria)
      )
    }

    if (filters.estado && filters.estado !== 'todos') {
      if (filters.estado === 'pendientes') {
        results = results.filter(
          solicitud =>
            solicitud.estado === 'pendiente' ||
            solicitud.estado === 'en_revision'
        )
      } else {
        results = results.filter(solicitud => solicitud.estado === filters.estado)
      }
    }

    if (filters.prioridad && filters.prioridad !== 'todas') {
      results = results.filter(solicitud => solicitud.prioridad === filters.prioridad)
    }

    if (filters.fechaDesde) {
      results = results.filter(
        solicitud => solicitud.fechaIngreso >= filters.fechaDesde!
      )
    }

    if (filters.fechaHasta) {
      results = results.filter(
        solicitud => solicitud.fechaIngreso <= filters.fechaHasta!
      )
    }

    if (filters.ordenar === 'antiguo') {
      return [...results].sort(
        (a, b) =>
          new Date(a.fechaIngreso).getTime() -
          new Date(b.fechaIngreso).getTime()
      )
    }

    if (filters.ordenar === 'nombre') {
      return [...results].sort((a, b) =>
        a.solicitante.localeCompare(b.solicitante)
      )
    }

    return [...results].sort(
      (a, b) =>
        new Date(b.fechaIngreso).getTime() -
        new Date(a.fechaIngreso).getTime()
    )
  },
}))

export default useSolicitudesStore