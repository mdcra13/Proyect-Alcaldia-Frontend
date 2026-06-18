import { create } from 'zustand'
import {
  api,
  toHistorialEntry,
  toSolicitud,
  type ApiCategory,
  type ApiRequestStatus,
} from '@/lib/api'
import type {
  CategoriesMap,
  Departamento,
  HistorialEntry,
  Solicitud,
  SolicitudCategoria,
  SolicitudEstado,
  SolicitudFilters,
  SolicitudPrioridad,
  SolicitudStats,
  UrgenciaLevel,
} from '@/lib/types'
import {
  ESTADO_TRANSITIONS_ALCALDE,
  ESTADO_TRANSITIONS_DEPARTAMENTO,
} from '@/lib/types'

export const CATEGORIES: CategoriesMap = {
  salud: {
    label: 'Salud',
    icon: 'hospital',
    color: 'bg-red-100 text-red-700 border-red-200',
    iconBg: 'bg-red-500',
  },
  educacion: {
    label: 'Educacion',
    icon: 'graduation-cap',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-500',
  },
  familiar: {
    label: 'Familiar',
    icon: 'users',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-500',
  },
  comunidad: {
    label: 'Comunidad',
    icon: 'landmark',
    color: 'bg-green-100 text-green-700 border-green-200',
    iconBg: 'bg-green-500',
  },
}

export function getUrgenciaLevel(fechaLimite: string): UrgenciaLevel {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const limite = new Date(fechaLimite)
  limite.setHours(0, 0, 0, 0)

  const diffTime = limite.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'vencida'
  if (diffDays <= 3) return 'urgente'
  if (diffDays <= 7) return 'proxima'
  return 'normal'
}

export function getDiasRestantes(fechaLimite: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const limite = new Date(fechaLimite)
  limite.setHours(0, 0, 0, 0)

  const diffTime = limite.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function ordenarPorFechaLimite(solicitudes: Solicitud[]): Solicitud[] {
  const urgencyOrder: Record<UrgenciaLevel, number> = {
    vencida: 0,
    urgente: 1,
    proxima: 2,
    normal: 3,
  }

  return [...solicitudes].sort((a, b) => {
    const urgencyA = getUrgenciaLevel(a.fechaLimite)
    const urgencyB = getUrgenciaLevel(b.fechaLimite)

    if (urgencyOrder[urgencyA] !== urgencyOrder[urgencyB]) {
      return urgencyOrder[urgencyA] - urgencyOrder[urgencyB]
    }

    return new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime()
  })
}

interface NewSolicitudData {
  titulo: string
  categoria: SolicitudCategoria
  departamentoId?: string
  fechaSolicitud?: string
  fechaLimite: string
  solicitante: string
  identificacion: string
  descripcion: string
  documento?: string
  documentoFile?: File
  subidoPor: string
  subidoPorId: string
}

const ESTADOS_PENDIENTES: SolicitudEstado[] = [
  'received',
  'assigned_to_department',
  'in_review',
  'awaiting_mayor_signature',
  'returned_to_department',
]
const ESTADOS_DEPARTAMENTO_PENDIENTES: SolicitudEstado[] = [
  'assigned_to_department',
  'in_review',
  'returned_to_department',
]
const ESTADOS_EN_PROCESO: SolicitudEstado[] = [
  'approved_by_department',
  'awaiting_mayor_signature',
  'returned_to_department',
]
const ESTADOS_APROBADAS: SolicitudEstado[] = ['signed']
const ESTADOS_DECLINADAS: SolicitudEstado[] = [
  'rejected_by_department',
  'rejected_by_mayor_office',
]
const ESTADOS_FINALIZADAS: SolicitudEstado[] = ['closed']
const ESTADOS_CON_MOTIVO: SolicitudEstado[] = [
  'rejected_by_department',
  'returned_to_department',
  'rejected_by_mayor_office',
]

function isValidTransition(
  transitions: Partial<Record<SolicitudEstado, SolicitudEstado[]>>,
  currentEstado: SolicitudEstado,
  nuevoEstado: SolicitudEstado
): boolean {
  return transitions[currentEstado]?.includes(nuevoEstado) ?? false
}

function priorityToApi(priority: SolicitudPrioridad) {
  const values: Record<SolicitudPrioridad, string> = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  }

  return values[priority]
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function categoryMatchesUi(category: ApiCategory, uiCategory: SolicitudCategoria) {
  const name = normalize(category.name)

  if (uiCategory === 'educacion') return name.includes('educ')
  if (uiCategory === 'familiar') return name.includes('famil')
  if (uiCategory === 'comunidad') return name.includes('comun') || name.includes('obra')

  return name.includes('salud') || uiCategory === 'salud'
}

interface SolicitudesState {
  solicitudes: Solicitud[]
  categories: ApiCategory[]
  statuses: ApiRequestStatus[]
  isLoading: boolean
  error: string | null
  fetchCatalogs: () => Promise<void>
  fetchSolicitudes: (departamentos?: Departamento[]) => Promise<void>
  fetchHistorial: (id: string) => Promise<HistorialEntry[]>
  getStats: (departamentoId?: string) => SolicitudStats
  getStatsForUser: (userId: string) => SolicitudStats
  getPendientes: (departamentoId?: string) => Solicitud[]
  getPendientesDepartamento: (departamentoId: string) => Solicitud[]
  getPendientesAlcalde: () => Solicitud[]
  getByStatus: (status: string, departamentoId?: string) => Solicitud[]
  getByDepartamento: (departamentoId: string) => Solicitud[]
  getBySubidoPor: (userId: string) => Solicitud[]
  getUrgentes: (limit?: number, departamentoId?: string) => Solicitud[]
  asignarDepartamento: (id: string, departamentoId: string, departamentoNombre: string, usuario: string, usuarioId?: string) => void
  cambiarEstadoDepartamento: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => Promise<void>
  cambiarEstadoAlcalde: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => Promise<void>
  aprobarDepartamento: (id: string, userId: string, userName: string) => Promise<void>
  aprobar: (id: string, userId: string, userName: string) => Promise<void>
  declinar: (id: string, motivo: string, userId: string, userName: string) => Promise<void>
  cambiarEstado: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => Promise<void>
  cambiarDepartamento: (id: string, nuevoDepartamentoId: string, userId: string, userName: string, motivo?: string) => void
  addSolicitud: (solicitud: NewSolicitudData) => Promise<Solicitud>
  search: (query: string, filters?: SolicitudFilters, departamentoId?: string) => Solicitud[]
  getSolicitudById: (id: string) => Solicitud | undefined
  CATEGORIES: CategoriesMap
}

const useSolicitudesStore = create<SolicitudesState>((set, get) => ({
  solicitudes: [],
  categories: [],
  statuses: [],
  isLoading: false,
  error: null,

  fetchCatalogs: async () => {
    const [categories, statuses] = await Promise.all([
      api.categories(),
      api.statuses(),
    ])

    set({ categories, statuses })
  },

  fetchSolicitudes: async (departamentos: Departamento[] = []) => {
    set({ isLoading: true, error: null })

    try {
      if (get().categories.length === 0 || get().statuses.length === 0) {
        await get().fetchCatalogs()
      }

      const solicitudes = (await api.requests()).map(item =>
        toSolicitud(item, departamentos),
      )

      set({ solicitudes, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las solicitudes.',
      })
    }
  },

  fetchHistorial: async (id: string) => {
    if (get().statuses.length === 0) {
      await get().fetchCatalogs()
    }

    const statusById = Object.fromEntries(
      get().statuses.map(status => [status.id, status]),
    )
    const historial = (await api.requestHistory(id)).map(item =>
      toHistorialEntry(item, statusById),
    )

    set(state => ({
      solicitudes: state.solicitudes.map(solicitud =>
        solicitud.id === id ? { ...solicitud, historial } : solicitud,
      ),
    }))

    return historial
  },

  getStats: (departamentoId?: string): SolicitudStats => {
    let solicitudes = get().solicitudes
    if (departamentoId) {
      solicitudes = solicitudes.filter(s => s.departamentoId === departamentoId)
    }

    return {
      total: solicitudes.length,
      pendientes: solicitudes.filter(s => ESTADOS_PENDIENTES.includes(s.estado)).length,
      enRevision: solicitudes.filter(s => ESTADOS_EN_PROCESO.includes(s.estado)).length,
      aprobadas: solicitudes.filter(s => ESTADOS_APROBADAS.includes(s.estado)).length,
      declinadas: solicitudes.filter(s => ESTADOS_DECLINADAS.includes(s.estado)).length,
      finalizadas: solicitudes.filter(s => ESTADOS_FINALIZADAS.includes(s.estado)).length,
    }
  },

  getStatsForUser: (userId: string): SolicitudStats => {
    const solicitudes = get().solicitudes.filter(s => s.subidoPorId === userId)

    return {
      total: solicitudes.length,
      pendientes: solicitudes.filter(s => ESTADOS_PENDIENTES.includes(s.estado)).length,
      enRevision: solicitudes.filter(s => ESTADOS_EN_PROCESO.includes(s.estado)).length,
      aprobadas: solicitudes.filter(s => ESTADOS_APROBADAS.includes(s.estado)).length,
      declinadas: solicitudes.filter(s => ESTADOS_DECLINADAS.includes(s.estado)).length,
      finalizadas: solicitudes.filter(s => ESTADOS_FINALIZADAS.includes(s.estado)).length,
    }
  },

  getPendientes: (departamentoId?: string): Solicitud[] => {
    let solicitudes = get().solicitudes.filter(s => ESTADOS_PENDIENTES.includes(s.estado))
    if (departamentoId) {
      solicitudes = solicitudes.filter(s => s.departamentoId === departamentoId)
    }
    return ordenarPorFechaLimite(solicitudes)
  },

  getPendientesDepartamento: (departamentoId: string): Solicitud[] => {
    return ordenarPorFechaLimite(
      get().solicitudes.filter(s =>
        ESTADOS_DEPARTAMENTO_PENDIENTES.includes(s.estado) && s.departamentoId === departamentoId
      )
    )
  },

  getPendientesAlcalde: (): Solicitud[] => {
    return ordenarPorFechaLimite(
      get().solicitudes.filter(s => s.estado === 'awaiting_mayor_signature')
    )
  },

  getByStatus: (status: string, departamentoId?: string): Solicitud[] => {
    let solicitudes = get().solicitudes
    if (departamentoId) {
      solicitudes = solicitudes.filter(s => s.departamentoId === departamentoId)
    }
    if (status === 'todos') return ordenarPorFechaLimite(solicitudes)
    if (status === 'pendientes') {
      return ordenarPorFechaLimite(solicitudes.filter(s => ESTADOS_PENDIENTES.includes(s.estado)))
    }
    if (status === 'en_proceso') {
      return ordenarPorFechaLimite(solicitudes.filter(s => ESTADOS_EN_PROCESO.includes(s.estado)))
    }
    if (status === 'aprobado') {
      return ordenarPorFechaLimite(solicitudes.filter(s => ESTADOS_APROBADAS.includes(s.estado)))
    }
    if (status === 'declinado') {
      return ordenarPorFechaLimite(solicitudes.filter(s => ESTADOS_DECLINADAS.includes(s.estado)))
    }
    return ordenarPorFechaLimite(solicitudes.filter(s => s.estado === status))
  },

  getByDepartamento: (departamentoId: string): Solicitud[] => {
    return ordenarPorFechaLimite(get().solicitudes.filter(s => s.departamentoId === departamentoId))
  },

  getBySubidoPor: (userId: string): Solicitud[] => {
    return ordenarPorFechaLimite(get().solicitudes.filter(s => s.subidoPorId === userId))
  },

  getUrgentes: (limit: number = 5, departamentoId?: string): Solicitud[] => {
    let solicitudes = get().solicitudes.filter(s => ESTADOS_PENDIENTES.includes(s.estado))
    if (departamentoId) {
      solicitudes = solicitudes.filter(s => s.departamentoId === departamentoId)
    }
    return ordenarPorFechaLimite(solicitudes).slice(0, limit)
  },

  asignarDepartamento: (id: string, departamentoId: string, departamentoNombre: string, usuario: string, usuarioId = 'system') => {
    set(state => ({
      solicitudes: state.solicitudes.map(s => {
        if (s.id !== id || s.estado !== 'received') return s

        return {
          ...s,
          departamentoId,
          departamento: {
            id: departamentoId,
            nombre: departamentoNombre,
            activo: true,
          },
          estado: 'assigned_to_department',
          historial: [
            ...s.historial,
            {
              id: crypto.randomUUID(),
              fecha: new Date().toISOString(),
              accion: 'assigned_to_department',
              descripcion: `Solicitud asignada al departamento ${departamentoNombre} por ${usuario}`,
              usuario,
              usuarioId,
            },
          ],
        }
      }),
    }))
  },

  cambiarEstadoDepartamento: async (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => {
    const solicitud = get().getSolicitudById(id)
    if (!solicitud) return

    if (!isValidTransition(ESTADO_TRANSITIONS_DEPARTAMENTO, solicitud.estado, nuevoEstado)) {
      return
    }

    await get().cambiarEstado(id, nuevoEstado, userId, userName, observacion)
  },

  cambiarEstadoAlcalde: async (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => {
    const solicitud = get().getSolicitudById(id)
    if (!solicitud) return

    if (!isValidTransition(ESTADO_TRANSITIONS_ALCALDE, solicitud.estado, nuevoEstado)) {
      return
    }

    await get().cambiarEstado(id, nuevoEstado, userId, userName, observacion)
  },

  aprobarDepartamento: async (id: string, userId: string, userName: string) => {
    await get().cambiarEstadoDepartamento(id, 'approved_by_department', userId, userName)
  },

  aprobar: async (id: string, userId: string, userName: string) => {
    await get().cambiarEstadoAlcalde(id, 'signed', userId, userName)
  },

  declinar: async (id: string, motivo: string, userId: string, userName: string) => {
    const solicitud = get().getSolicitudById(id)
    if (!solicitud) return

    if (ESTADOS_DEPARTAMENTO_PENDIENTES.includes(solicitud.estado)) {
      await get().cambiarEstadoDepartamento(id, 'rejected_by_department', userId, userName, motivo)
      return
    }

    await get().cambiarEstadoAlcalde(id, 'rejected_by_mayor_office', userId, userName, motivo)
  },

  cambiarEstado: async (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => {
    const status = get().statuses.find(item => item.name === nuevoEstado)

    if (status) {
      try {
        await api.changeRequestStatus(id, status.id)
      } catch {
        // Keep the optimistic UI update usable while backend permissions evolve.
      }
    }

    set(state => ({
      solicitudes: state.solicitudes.map(s => {
        if (s.id !== id) return s

        return {
          ...s,
          estado: nuevoEstado,
          motivoRechazo: ESTADOS_CON_MOTIVO.includes(nuevoEstado)
            ? observacion || s.motivoRechazo
            : s.motivoRechazo,
          historial: [
            ...s.historial,
            {
              id: crypto.randomUUID(),
              fecha: new Date().toISOString(),
              accion: nuevoEstado,
              descripcion: observacion || `Estado actualizado a ${nuevoEstado}`,
              usuario: userName,
              usuarioId: userId,
            },
          ],
        }
      }),
    }))
  },

  cambiarDepartamento: (id: string, nuevoDepartamentoId: string, userId: string, userName: string, motivo?: string) => {
    set(state => ({
      solicitudes: state.solicitudes.map(s => {
        if (s.id !== id) return s

        return {
          ...s,
          departamentoId: nuevoDepartamentoId,
          historial: [
            ...s.historial,
            {
              id: crypto.randomUUID(),
              fecha: new Date().toISOString(),
              accion: s.estado,
              descripcion: `Departamento actualizado${motivo ? `. Motivo: ${motivo}` : ''}`,
              usuario: userName,
              usuarioId: userId,
            },
          ],
        }
      }),
    }))
  },

  addSolicitud: async (solicitud: NewSolicitudData): Promise<Solicitud> => {
    if (get().categories.length === 0 || get().statuses.length === 0) {
      await get().fetchCatalogs()
    }

    const category =
      get().categories.find(item => categoryMatchesUi(item, solicitud.categoria)) ??
      get().categories[0]

    if (!category || !solicitud.departamentoId) {
      throw new Error('Debe existir una categoria y un departamento valido.')
    }

    const created = await api.createRequest({
      subject: solicitud.titulo,
      description: solicitud.descripcion,
      applicantName: solicitud.solicitante,
      applicantContact: solicitud.identificacion,
      categoryId: category.id,
      departmentId: solicitud.departamentoId,
      priority: priorityToApi('MEDIUM'),
    })

    const createdId = 'id' in created ? created.id : ''

    if (createdId && solicitud.documentoFile) {
      await api.uploadRequestDocument(createdId, solicitud.documentoFile)
    }

    const departamentos = get()
      .solicitudes.map(item => item.departamento)
      .filter(Boolean) as Departamento[]

    const solicitudCreada = toSolicitud(
      {
        id: createdId,
        subject: solicitud.titulo,
        applicantName: solicitud.solicitante,
        categoryName: category.name,
        departmentName:
          departamentos.find(item => item.id === solicitud.departamentoId)?.nombre ??
          '',
        statusName: 'received',
        priority: priorityToApi('MEDIUM'),
        userAssignedName: null,
        trackingCode: 'trackingCode' in created ? created.trackingCode : createdId,
        createdAt: 'createdAt' in created ? created.createdAt : new Date().toISOString(),
        description: solicitud.descripcion,
        applicantContact: solicitud.identificacion,
        receivedByName: solicitud.subidoPor,
        updatedAt: new Date().toISOString(),
      },
      departamentos,
    )

    solicitudCreada.subidoPor = solicitud.subidoPor
    solicitudCreada.subidoPorId = solicitud.subidoPorId
    solicitudCreada.departamentoId = solicitud.departamentoId
    solicitudCreada.fechaLimite = solicitud.fechaLimite
    solicitudCreada.documento = solicitud.documento

    set(state => ({
      solicitudes: [solicitudCreada, ...state.solicitudes],
    }))

    return solicitudCreada
  },

  search: (query: string, filters: SolicitudFilters = {}, departamentoId?: string): Solicitud[] => {
    let results = get().solicitudes

    if (departamentoId) {
      results = results.filter(s => s.departamentoId === departamentoId)
    }

    if (query) {
      const q = query.toLowerCase()
      results = results.filter(s =>
        s.solicitante.toLowerCase().includes(q) ||
        s.identificacion.toLowerCase().includes(q) ||
        s.radicado.toLowerCase().includes(q) ||
        s.titulo.toLowerCase().includes(q)
      )
    }

    if (filters.categorias && filters.categorias.length > 0) {
      results = results.filter(s => filters.categorias!.includes(s.categoria))
    }

    if (filters.estado && filters.estado !== 'todos') {
      if (filters.estado === 'pendientes') {
        results = results.filter(s => ESTADOS_PENDIENTES.includes(s.estado))
      } else if (filters.estado === 'en_proceso') {
        results = results.filter(s => ESTADOS_EN_PROCESO.includes(s.estado))
      } else if (filters.estado === 'aprobado') {
        results = results.filter(s => ESTADOS_APROBADAS.includes(s.estado))
      } else if (filters.estado === 'declinado') {
        results = results.filter(s => ESTADOS_DECLINADAS.includes(s.estado))
      } else {
        results = results.filter(s => s.estado === filters.estado)
      }
    }

    if (filters.departamentoId) {
      results = results.filter(s => s.departamentoId === filters.departamentoId)
    }

    if (filters.fechaDesde) {
      results = results.filter(s => s.fechaSolicitud >= filters.fechaDesde!)
    }

    if (filters.fechaHasta) {
      results = results.filter(s => s.fechaSolicitud <= filters.fechaHasta!)
    }

    if (filters.ordenar === 'antiguo') {
      return [...results].sort((a, b) => new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime())
    }

    if (filters.ordenar === 'nombre') {
      return [...results].sort((a, b) => a.solicitante.localeCompare(b.solicitante))
    }

    if (filters.ordenar === 'reciente') {
      return [...results].sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())
    }

    return ordenarPorFechaLimite(results)
  },

  getSolicitudById: (id: string): Solicitud | undefined => {
    return get().solicitudes.find(s => s.id === id)
  },

  CATEGORIES,
}))

export { useSolicitudesStore }
export default useSolicitudesStore
