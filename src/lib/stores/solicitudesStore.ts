
import { create } from 'zustand'
import {
  backendApi,
  mapBackendDepartment,
  mapBackendRequest,
  mapBackendHistory,
  mapBackendDocuments,
} from '@/lib/api/backend'
import type {
  Solicitud,
  SolicitudCategoria,
  SolicitudEstado,
  SolicitudStats,
  SolicitudFilters,
  CategoriesMap,
  UrgenciaLevel,
  SolicitudPrioridad,
} from '@/lib/types'
import {
  ESTADO_TRANSITIONS_DEPARTAMENTO,
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

export function getUrgenciaLevel(fechaLimite: string): UrgenciaLevel {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limite = new Date(fechaLimite)
  limite.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(
    (limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

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
  return Math.ceil(
    (limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
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
  prioridad: SolicitudPrioridad
  documento: File
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
function isValidTransition(
  transitions: Partial<Record<SolicitudEstado, SolicitudEstado[]>>,
  currentEstado: SolicitudEstado,
  nuevoEstado: SolicitudEstado
): boolean {
  return transitions[currentEstado]?.includes(nuevoEstado) ?? false
}

async function loadPersistedRequest(id: string): Promise<Solicitud> {
  const [details, backendDepartments, history, documents] = await Promise.all([
    backendApi.requestDetails(id),
    backendApi.departments(),
    backendApi.requestHistory(id),
    backendApi.requestDocuments(id),
  ])
  const solicitud = mapBackendRequest(
    details,
    backendDepartments.map(mapBackendDepartment)
  )
  solicitud.historial = mapBackendHistory(history)
  solicitud.documentos = mapBackendDocuments(documents)
  return solicitud
}

interface SolicitudesState {
  solicitudes: Solicitud[]
  fetchSolicitudes: () => Promise<void>
  loadSolicitudDetails: (id: string) => Promise<Solicitud>
  getStats: (departamentoId?: string) => SolicitudStats
  getStatsForUser: (userId: string) => SolicitudStats
  getPendientes: (departamentoId?: string) => Solicitud[]
  getPendientesDepartamento: (departamentoId: string) => Solicitud[]
  getPendientesAlcalde: () => Solicitud[]
  getByStatus: (status: string, departamentoId?: string) => Solicitud[]
  getByDepartamento: (departamentoId: string) => Solicitud[]
  getBySubidoPor: (userId: string) => Solicitud[]
  getUrgentes: (limit?: number, departamentoId?: string) => Solicitud[]
  asignarDepartamento: (id: string, departamentoId: string, departamentoNombre: string, usuario: string, usuarioId?: string) => Promise<void>
  cambiarEstadoDepartamento: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => Promise<void>
  cambiarEstadoAlcalde: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => Promise<void>
  aprobarDepartamento: (id: string, userId: string, userName: string) => Promise<void>
  reenviarConCorrecciones: (id: string, file: File, userId: string, userName: string) => Promise<void>
  aprobar: (id: string, userId: string, userName: string) => Promise<void>
  declinar: (id: string, motivo: string, userId: string, userName: string) => Promise<void>
  cambiarEstado: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => Promise<void>
  cambiarDepartamento: (id: string, nuevoDepartamentoId: string, userId: string, userName: string, motivo?: string) => Promise<void>
  addSolicitud: (solicitud: NewSolicitudData) => Promise<Solicitud>
  registrarVista: (id: string, userId: string, userName: string) => Solicitud | undefined
  search: (query: string, filters?: SolicitudFilters, departamentoId?: string) => Solicitud[]
  getSolicitudById: (id: string) => Solicitud | undefined
  CATEGORIES: CategoriesMap
}

const useSolicitudesStore = create<SolicitudesState>((set, get) => ({
  solicitudes: [],

  fetchSolicitudes: async () => {
    try {
      const [backendDepartments, backendRequests] = await Promise.all([
        backendApi.departments(),
        backendApi.requests(),
      ])
      const departments = backendDepartments.map(mapBackendDepartment)
      const solicitudes = backendRequests.map(request =>
        mapBackendRequest(request, departments)
      )

      set({ solicitudes })
    } catch {
      set({ solicitudes: [] })
    }
  },

  loadSolicitudDetails: async id => {
    const persisted = await loadPersistedRequest(id)
    set(state => ({
      solicitudes: state.solicitudes.map(item => item.id === id ? persisted : item),
    }))
    return persisted
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

  asignarDepartamento: async (id, departamentoId, departamentoNombre, usuario) => {
    await get().cambiarDepartamento(
      id,
      departamentoId,
      '',
      usuario,
      `Asignada a ${departamentoNombre}`
    )
  },

  cambiarEstadoDepartamento: async (id, nuevoEstado, _userId, _userName, observacion) => {
    await backendApi.changeStatus(id, nuevoEstado, observacion)
    const persisted = await loadPersistedRequest(id)
    set(state => ({
      solicitudes: state.solicitudes.map(item => item.id === id ? persisted : item),
    }))
  },

  cambiarEstadoAlcalde: async (id, nuevoEstado, userId, userName, observacion) => {
    await get().cambiarEstadoDepartamento(id, nuevoEstado, userId, userName, observacion)
  },

  aprobarDepartamento: async (id, userId, userName) => {
    await get().cambiarEstadoDepartamento(id, 'approved_by_department', userId, userName)
  },

  reenviarConCorrecciones: async (id, file, userId, userName) => {
    await backendApi.uploadRequestDocument(id, file)
    await get().cambiarEstadoDepartamento(
      id,
      'in_review',
      userId,
      userName,
      'Correcciones recibidas; el departamento inició una nueva revisión',
    )
    await get().cambiarEstadoDepartamento(
      id,
      'approved_by_department',
      userId,
      userName,
      `Documento corregido reenviado a Alcaldía: ${file.name}`,
    )
  },

  aprobar: async (id, userId, userName) => {
    await get().cambiarEstadoAlcalde(id, 'signed', userId, userName)
  },

  declinar: async (id, motivo, userId, userName) => {
    const solicitud = get().getSolicitudById(id)
    if (!solicitud) return

    if (ESTADOS_DEPARTAMENTO_PENDIENTES.includes(solicitud.estado)) {
      await get().cambiarEstadoDepartamento(id, 'rejected_by_department', userId, userName, motivo)
      return
    }

    await get().cambiarEstadoAlcalde(id, 'rejected_by_mayor_office', userId, userName, motivo)
  },

  cambiarEstado: async (id, nuevoEstado, userId, userName, observacion) => {
    const solicitud = get().getSolicitudById(id)
    if (!solicitud) return

    if (isValidTransition(ESTADO_TRANSITIONS_DEPARTAMENTO, solicitud.estado, nuevoEstado)) {
      await get().cambiarEstadoDepartamento(id, nuevoEstado, userId, userName, observacion)
      return
    }

    await get().cambiarEstadoAlcalde(id, nuevoEstado, userId, userName, observacion)
  },

  cambiarDepartamento: async (id, nuevoDepartamentoId, _userId, _userName, motivo) => {
    await backendApi.changeDepartment(id, nuevoDepartamentoId, motivo)
    const persisted = await loadPersistedRequest(id)
    set(state => ({
      solicitudes: state.solicitudes.map(item => item.id === id ? persisted : item),
    }))
  },

  addSolicitud: async (solicitud: NewSolicitudData): Promise<Solicitud> => {
    const created = await backendApi.createRequest({
      titulo: solicitud.titulo,
      descripcion: solicitud.descripcion,
      solicitante: solicitud.solicitante,
      identificacion: solicitud.identificacion,
      categoria: solicitud.categoria,
      departamentoId: solicitud.departamentoId,
      prioridad: solicitud.prioridad,
      fechaSolicitud: solicitud.fechaSolicitud,
      fechaLimite: solicitud.fechaLimite,
    })

    await backendApi.uploadRequestDocument(created.id, solicitud.documento)

    const [details, departments, history] = await Promise.all([
      backendApi.requestDetails(created.id),
      backendApi.departments(),
      backendApi.requestHistory(created.id),
    ])
    const persisted = mapBackendRequest(
      details,
      departments.map(mapBackendDepartment)
    )
    persisted.historial = history.length
      ? history.map(entry => ({
          id: entry.id,
          fecha: entry.createdAt,
          accion: entry.eventType,
          descripcion: entry.observation || 'Solicitud registrada',
          usuario: solicitud.subidoPor,
          usuarioId: entry.userId,
        }))
      : persisted.historial

    set(state => ({ solicitudes: [persisted, ...state.solicitudes] }))
    return persisted
  },

  registrarVista: (id, userId, userName) => {
    const solicitud = get().getSolicitudById(id)
    if (!solicitud) return undefined

    const descripcion = `Documento revisado por ${userName}`
    const alreadyRegistered = solicitud.historial.some(
      entry => entry.usuarioId === userId && entry.descripcion === descripcion
    )
    if (alreadyRegistered) return solicitud

    const updatedSolicitud: Solicitud = {
      ...solicitud,
      historial: [
        ...solicitud.historial,
        {
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          accion: solicitud.estado,
          descripcion,
          usuario: userName,
          usuarioId: userId,
        },
      ],
    }
    set(state => ({
      solicitudes: state.solicitudes.map(item => item.id === id ? updatedSolicitud : item),
    }))
    void backendApi.registerDocumentView(id).catch(() => undefined)
    return updatedSolicitud
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
