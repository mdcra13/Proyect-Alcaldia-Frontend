import { create } from 'zustand'
import type {
  Solicitud,
  SolicitudCategoria,
  SolicitudEstado,
  SolicitudStats,
  SolicitudFilters,
  CategoriesMap,
  HistorialEntry,
  UrgenciaLevel,
  Departamento,
} from '@/lib/types'
import {
  ESTADO_TRANSITIONS_ALCALDE,
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

const mockDepartamentos: Record<string, Departamento> = {
  'dep-1': { id: 'dep-1', nombre: 'Salud', activo: true },
  'dep-2': { id: 'dep-2', nombre: 'Educación', activo: true },
  'dep-3': { id: 'dep-3', nombre: 'Obras Públicas', activo: true },
  'dep-4': { id: 'dep-4', nombre: 'Desarrollo Social', activo: true },
  'dep-5': { id: 'dep-5', nombre: 'Alcaldía', activo: true },
  'dep-6': { id: 'dep-6', nombre: 'Hacienda', activo: true },
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

const today = new Date()
const getDate = (daysOffset: number): string => {
  const date = new Date(today)
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString().split('T')[0]
}

const createHistorial = (
  id: string,
  daysOffset: number,
  accion: SolicitudEstado,
  descripcion: string,
  usuario: string,
  usuarioId: string
): HistorialEntry => ({
  id,
  fecha: getDate(daysOffset),
  accion,
  descripcion,
  usuario,
  usuarioId,
})

const mockSolicitudes: Solicitud[] = [
  {
    id: '1001',
    radicado: '#1001',
    titulo: 'Solicitud de apoyo médico',
    descripcion: 'Solicitud de apoyo para tratamiento médico especializado.',
    solicitante: 'Juan Pérez García',
    identificacion: '8-123-456',
    categoria: 'salud',
    fechaSolicitud: getDate(-10),
    fechaLimite: getDate(-2),
    estado: 'received',
    prioridad: 'HIGH',
    subidoPor: 'María García',
    subidoPorId: '2',
    documento: 'solicitud_1001.pdf',
    historial: [
      createHistorial('h-1001-1', -10, 'received', 'Solicitud registrada por María García', 'María García', '2'),
    ],
  },
  {
    id: '1002',
    radicado: '#1002',
    titulo: 'Beca escolar para hijos',
    descripcion: 'Solicitud de beca escolar para dos hijos menores.',
    solicitante: 'Ana María López',
    identificacion: '8-876-543',
    categoria: 'educacion',
    departamentoId: 'dep-2',
    departamento: mockDepartamentos['dep-2'],
    fechaSolicitud: getDate(-8),
    fechaLimite: getDate(1),
    estado: 'assigned_to_department',
    prioridad: 'HIGH',
    subidoPor: 'María García',
    subidoPorId: '2',
    documento: 'solicitud_1002.pdf',
    historial: [
      createHistorial('h-1002-1', -8, 'received', 'Solicitud registrada por María García', 'María García', '2'),
      createHistorial('h-1002-2', -8, 'assigned_to_department', 'Solicitud asignada al departamento Educación por María García', 'María García', '2'),
    ],
  },
  {
    id: '1003',
    radicado: '#1003',
    titulo: 'Ayuda alimentaria familiar',
    descripcion: 'Solicitud de ayuda alimentaria para familia de cinco miembros.',
    solicitante: 'Pedro Ramírez',
    identificacion: 'PE-11223344',
    categoria: 'familiar',
    departamentoId: 'dep-4',
    departamento: mockDepartamentos['dep-4'],
    fechaSolicitud: getDate(-7),
    fechaLimite: getDate(2),
    estado: 'in_review',
    prioridad: 'URGENT',
    subidoPor: 'Ana López',
    subidoPorId: '3',
    documento: 'solicitud_1003.pdf',
    historial: [
      createHistorial('h-1003-1', -7, 'received', 'Solicitud registrada por Ana López', 'Ana López', '3'),
      createHistorial('h-1003-2', -6, 'assigned_to_department', 'Solicitud asignada al departamento Desarrollo Social por Ana López', 'Ana López', '3'),
      createHistorial('h-1003-3', -5, 'in_review', 'Revisión iniciada por Carmen Ruiz del departamento Desarrollo Social', 'Carmen Ruiz', '8'),
    ],
  },
  {
    id: '1004',
    radicado: '#1004',
    titulo: 'Mejoramiento vía barrial',
    descripcion: 'Solicitud para mejoramiento de la vía principal del barrio.',
    solicitante: 'Comunidad Los Pinos',
    identificacion: 'JAC-0001',
    categoria: 'comunidad',
    departamentoId: 'dep-3',
    departamento: mockDepartamentos['dep-3'],
    fechaSolicitud: getDate(-12),
    fechaLimite: getDate(5),
    estado: 'approved_by_department',
    prioridad: 'MEDIUM',
    subidoPor: 'Lucía Torres',
    subidoPorId: '4',
    documento: 'solicitud_1004.pdf',
    motivoRechazo: null,
    historial: [
      createHistorial('h-1004-1', -12, 'received', 'Solicitud registrada por Lucía Torres', 'Lucía Torres', '4'),
      createHistorial('h-1004-2', -11, 'assigned_to_department', 'Solicitud asignada al departamento Obras Públicas por Lucía Torres', 'Lucía Torres', '4'),
      createHistorial('h-1004-3', -6, 'approved_by_department', 'Aprobada por el departamento Obras Públicas', 'Roberto Díaz', '7'),
    ],
  },
  {
    id: '1005',
    radicado: '#1005',
    titulo: 'Apoyo para cirugía',
    descripcion: 'Solicitud de apoyo económico para cirugía de urgencia.',
    solicitante: 'Rosa Martínez',
    identificacion: '8-556-778',
    categoria: 'salud',
    departamentoId: 'dep-1',
    departamento: mockDepartamentos['dep-1'],
    fechaSolicitud: getDate(-15),
    fechaLimite: getDate(10),
    estado: 'signed',
    prioridad: 'HIGH',
    subidoPor: 'Ana López',
    subidoPorId: '3',
    documento: 'solicitud_1005.pdf',
    historial: [
      createHistorial('h-1005-1', -15, 'received', 'Solicitud registrada por Ana López', 'Ana López', '3'),
      createHistorial('h-1005-2', -14, 'assigned_to_department', 'Solicitud asignada al departamento Salud por Ana López', 'Ana López', '3'),
      createHistorial('h-1005-3', -13, 'in_review', 'Revisión iniciada por Juan Hernández del departamento Salud', 'Juan Hernández', '5'),
      createHistorial('h-1005-4', -12, 'approved_by_department', 'Aprobada por el departamento Salud', 'Juan Hernández', '5'),
      createHistorial('h-1005-5', -11, 'awaiting_mayor_signature', 'Enviada a Alcaldía para revisión por Juan Hernández', 'Juan Hernández', '5'),
      createHistorial('h-1005-6', -10, 'signed', 'Firmada lógicamente por Carlos Mendoza — Alcaldía Municipal', 'Carlos Mendoza', '1'),
    ],
  },
  {
    id: '1006',
    radicado: '#1006',
    titulo: 'Útiles escolares',
    descripcion: 'Solicitud de kit de útiles escolares para tres niños.',
    solicitante: 'Carmen Sánchez',
    identificacion: '8-998-776',
    categoria: 'educacion',
    departamentoId: 'dep-2',
    departamento: mockDepartamentos['dep-2'],
    fechaSolicitud: getDate(-20),
    fechaLimite: getDate(-5),
    estado: 'rejected_by_department',
    prioridad: 'LOW',
    subidoPor: 'María García',
    subidoPorId: '2',
    documento: 'solicitud_1006.pdf',
    motivoRechazo: 'Documentación incompleta. Se requiere certificado de estudios actualizado.',
    historial: [
      createHistorial('h-1006-1', -20, 'received', 'Solicitud registrada por María García', 'María García', '2'),
      createHistorial('h-1006-2', -19, 'assigned_to_department', 'Solicitud asignada al departamento Educación por María García', 'María García', '2'),
      createHistorial('h-1006-3', -17, 'in_review', 'Revisión iniciada por Laura Sánchez del departamento Educación', 'Laura Sánchez', '6'),
      createHistorial('h-1006-4', -15, 'rejected_by_department', 'Rechazada por el departamento Educación. Motivo: Documentación incompleta. Se requiere certificado de estudios actualizado.', 'Laura Sánchez', '6'),
    ],
  },
  {
    id: '1007',
    radicado: '#1007',
    titulo: 'Subsidio de vivienda',
    descripcion: 'Solicitud de subsidio para mejoramiento de vivienda.',
    solicitante: 'Jorge Hernández',
    identificacion: '8-443-221',
    categoria: 'familiar',
    departamentoId: 'dep-4',
    departamento: mockDepartamentos['dep-4'],
    fechaSolicitud: getDate(-5),
    fechaLimite: getDate(4),
    estado: 'awaiting_mayor_signature',
    prioridad: 'MEDIUM',
    subidoPor: 'Ana López',
    subidoPorId: '3',
    documento: 'solicitud_1007.pdf',
    historial: [
      createHistorial('h-1007-1', -5, 'received', 'Solicitud registrada por Ana López', 'Ana López', '3'),
      createHistorial('h-1007-2', -5, 'assigned_to_department', 'Solicitud asignada al departamento Desarrollo Social por Ana López', 'Ana López', '3'),
      createHistorial('h-1007-3', -4, 'in_review', 'Revisión iniciada por Carmen Ruiz del departamento Desarrollo Social', 'Carmen Ruiz', '8'),
      createHistorial('h-1007-4', -3, 'approved_by_department', 'Aprobada por el departamento Desarrollo Social', 'Carmen Ruiz', '8'),
      createHistorial('h-1007-5', -3, 'awaiting_mayor_signature', 'Enviada a Alcaldía para revisión por Carmen Ruiz', 'Carmen Ruiz', '8'),
    ],
  },
  {
    id: '1008',
    radicado: '#1008',
    titulo: 'Alumbrado público',
    descripcion: 'Solicitud de instalación de alumbrado público en zona oscura.',
    solicitante: 'JAC Barrio Centro',
    identificacion: 'JAC-0202',
    categoria: 'comunidad',
    departamentoId: 'dep-3',
    departamento: mockDepartamentos['dep-3'],
    fechaSolicitud: getDate(-3),
    fechaLimite: getDate(6),
    estado: 'returned_to_department',
    prioridad: 'MEDIUM',
    subidoPor: 'María García',
    subidoPorId: '2',
    documento: 'solicitud_1008.pdf',
    motivoRechazo: 'Falta el presupuesto detallado del proyecto.',
    historial: [
      createHistorial('h-1008-1', -3, 'received', 'Solicitud registrada por María García', 'María García', '2'),
      createHistorial('h-1008-2', -3, 'assigned_to_department', 'Solicitud asignada al departamento Obras Públicas por María García', 'María García', '2'),
      createHistorial('h-1008-3', -2, 'approved_by_department', 'Aprobada por el departamento Obras Públicas', 'Roberto Díaz', '7'),
      createHistorial('h-1008-4', -2, 'awaiting_mayor_signature', 'Enviada a Alcaldía para revisión por Roberto Díaz', 'Roberto Díaz', '7'),
      createHistorial('h-1008-5', -1, 'returned_to_department', 'Devuelta al departamento Obras Públicas. Motivo: Falta el presupuesto detallado del proyecto.', 'Carlos Mendoza', '1'),
    ],
  },
  {
    id: '1009',
    radicado: '#1009',
    titulo: 'Medicamentos especializados',
    descripcion: 'Solicitud de medicamentos para tratamiento crónico.',
    solicitante: 'Luis Fernando Díaz',
    identificacion: '8-667-889',
    categoria: 'salud',
    departamentoId: 'dep-1',
    departamento: mockDepartamentos['dep-1'],
    fechaSolicitud: getDate(-4),
    fechaLimite: getDate(8),
    estado: 'rejected_by_mayor_office',
    prioridad: 'URGENT',
    subidoPor: 'Lucía Torres',
    subidoPorId: '4',
    documento: 'solicitud_1009.pdf',
    motivoRechazo: 'La solicitud no corresponde a los programas vigentes de la Alcaldía.',
    historial: [
      createHistorial('h-1009-1', -4, 'received', 'Solicitud registrada por Lucía Torres', 'Lucía Torres', '4'),
      createHistorial('h-1009-2', -4, 'assigned_to_department', 'Solicitud asignada al departamento Salud por Lucía Torres', 'Lucía Torres', '4'),
      createHistorial('h-1009-3', -3, 'approved_by_department', 'Aprobada por el departamento Salud', 'Juan Hernández', '5'),
      createHistorial('h-1009-4', -3, 'awaiting_mayor_signature', 'Enviada a Alcaldía para revisión por Juan Hernández', 'Juan Hernández', '5'),
      createHistorial('h-1009-5', -2, 'rejected_by_mayor_office', 'Rechazada por el despacho de Alcaldía. Motivo: La solicitud no corresponde a los programas vigentes de la Alcaldía.', 'Carlos Mendoza', '1'),
    ],
  },
  {
    id: '1010',
    radicado: '#1010',
    titulo: 'Transporte escolar',
    descripcion: 'Solicitud de ruta de transporte escolar para zona rural.',
    solicitante: 'Vereda El Roble',
    identificacion: 'COM-1010',
    categoria: 'educacion',
    departamentoId: 'dep-5',
    departamento: mockDepartamentos['dep-5'],
    fechaSolicitud: getDate(-25),
    fechaLimite: getDate(15),
    estado: 'closed',
    prioridad: 'LOW',
    subidoPor: 'María García',
    subidoPorId: '2',
    documento: 'solicitud_1010.pdf',
    historial: [
      createHistorial('h-1010-1', -25, 'received', 'Solicitud registrada por María García', 'María García', '2'),
      createHistorial('h-1010-2', -24, 'assigned_to_department', 'Solicitud asignada al departamento Alcaldía por María García', 'María García', '2'),
      createHistorial('h-1010-3', -20, 'approved_by_department', 'Aprobada por el departamento Alcaldía', 'Laura Sánchez', '6'),
      createHistorial('h-1010-4', -19, 'awaiting_mayor_signature', 'Enviada a Alcaldía para revisión por Laura Sánchez', 'Laura Sánchez', '6'),
      createHistorial('h-1010-5', -18, 'signed', 'Firmada lógicamente por Carlos Mendoza — Alcaldía Municipal', 'Carlos Mendoza', '1'),
      createHistorial('h-1010-6', -10, 'closed', 'Solicitud cerrada por Laura Sánchez', 'Laura Sánchez', '6'),
    ],
  },
  {
    id: '1011',
    radicado: '#1011',
    titulo: 'Exoneración temporal de tasa municipal',
    descripcion: 'Solicitud de revisión social para exoneración temporal de tasa municipal.',
    solicitante: 'Marta Castillo',
    identificacion: '8-345-909',
    categoria: 'familiar',
    departamentoId: 'dep-6',
    departamento: mockDepartamentos['dep-6'],
    fechaSolicitud: getDate(-2),
    fechaLimite: getDate(12),
    estado: 'assigned_to_department',
    prioridad: 'MEDIUM',
    subidoPor: 'Lucía Torres',
    subidoPorId: '4',
    documento: 'solicitud_1011.pdf',
    historial: [
      createHistorial('h-1011-1', -2, 'received', 'Solicitud registrada por Lucía Torres', 'Lucía Torres', '4'),
      createHistorial('h-1011-2', -2, 'assigned_to_department', 'Solicitud asignada al departamento Hacienda por Lucía Torres', 'Lucía Torres', '4'),
    ],
  },
  {
    id: '1012',
    radicado: '#1012',
    titulo: 'Apoyo para jornada comunitaria',
    descripcion: 'Solicitud de apoyo logístico para jornada comunitaria de limpieza.',
    solicitante: 'Comité Nuevo Amanecer',
    identificacion: 'COM-1012',
    categoria: 'comunidad',
    fechaSolicitud: getDate(-1),
    fechaLimite: getDate(20),
    estado: 'received',
    prioridad: 'LOW',
    subidoPor: 'Ana López',
    subidoPorId: '3',
    documento: 'solicitud_1012.pdf',
    historial: [
      createHistorial('h-1012-1', -1, 'received', 'Solicitud registrada por Ana López', 'Ana López', '3'),
    ],
  },
]

interface NewSolicitudData {
  titulo: string
  categoria: SolicitudCategoria
  departamentoId?: string
  fechaSolicitud?: string
  fechaLimite: string
  solicitante: string
  identificacion: string
  descripcion: string
  documento: string
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

function buildHistorialDescripcion(
  estado: SolicitudEstado,
  userName: string,
  departamentoNombre?: string,
  motivo?: string
): string {
  switch (estado) {
    case 'received':
      return `Solicitud registrada por ${userName}`
    case 'assigned_to_department':
      return `Solicitud asignada al departamento ${departamentoNombre || 'responsable'} por ${userName}`
    case 'in_review':
      return `Revisión iniciada por ${userName} del departamento ${departamentoNombre || 'responsable'}`
    case 'approved_by_department':
      return `Aprobada por el departamento ${departamentoNombre || 'responsable'}`
    case 'rejected_by_department':
      return `Rechazada por el departamento ${departamentoNombre || 'responsable'}. Motivo: ${motivo || 'No especificado'}`
    case 'awaiting_mayor_signature':
      return `Enviada a Alcaldía para revisión por ${userName}`
    case 'returned_to_department':
      return `Devuelta al departamento ${departamentoNombre || 'responsable'}. Motivo: ${motivo || 'No especificado'}`
    case 'rejected_by_mayor_office':
      return `Rechazada por el despacho de Alcaldía. Motivo: ${motivo || 'No especificado'}`
    case 'signed':
      return `Firmada lógicamente por ${userName} — Alcaldía Municipal`
    case 'closed':
      return `Solicitud cerrada por ${userName}`
  }
}

function createHistorialEntry(
  estado: SolicitudEstado,
  userId: string,
  userName: string,
  departamentoNombre?: string,
  motivo?: string
): HistorialEntry {
  return {
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
    accion: estado,
    descripcion: buildHistorialDescripcion(estado, userName, departamentoNombre, motivo),
    usuario: userName,
    usuarioId: userId,
  }
}

function isValidTransition(
  transitions: Partial<Record<SolicitudEstado, SolicitudEstado[]>>,
  currentEstado: SolicitudEstado,
  nuevoEstado: SolicitudEstado
): boolean {
  return transitions[currentEstado]?.includes(nuevoEstado) ?? false
}

interface SolicitudesState {
  solicitudes: Solicitud[]
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
  cambiarEstadoDepartamento: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => void
  cambiarEstadoAlcalde: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => void
  aprobarDepartamento: (id: string, userId: string, userName: string) => void
  aprobar: (id: string, userId: string, userName: string) => void
  declinar: (id: string, motivo: string, userId: string, userName: string) => void
  cambiarEstado: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => void
  cambiarDepartamento: (id: string, nuevoDepartamentoId: string, userId: string, userName: string, motivo?: string) => void
  addSolicitud: (solicitud: NewSolicitudData) => Solicitud
  search: (query: string, filters?: SolicitudFilters, departamentoId?: string) => Solicitud[]
  getSolicitudById: (id: string) => Solicitud | undefined
  CATEGORIES: CategoriesMap
}

const useSolicitudesStore = create<SolicitudesState>((set, get) => ({
  solicitudes: mockSolicitudes,

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
    // TODO: Replace with API call PATCH /api/v1/requests/:id/departamento
    const departamento = mockDepartamentos[departamentoId] || {
      id: departamentoId,
      nombre: departamentoNombre,
      activo: true,
    }

    set(state => ({
      solicitudes: state.solicitudes.map(s => {
        if (s.id !== id || s.estado !== 'received') return s

        return {
          ...s,
          departamentoId,
          departamento,
          estado: 'assigned_to_department',
          historial: [
            ...s.historial,
            {
              id: `h-${Date.now()}`,
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

cambiarEstadoDepartamento: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => {
  // TODO: Replace with API call PATCH /api/v1/requests/:id/status
  set(state => ({
    solicitudes: state.solicitudes.map(s => {
      if (s.id !== id || !isValidTransition(ESTADO_TRANSITIONS_DEPARTAMENTO, s.estado, nuevoEstado)) {
        return s
      }

      const historial = [
        ...s.historial,
        createHistorialEntry(
          nuevoEstado,
          userId,
          userName,
          s.departamento?.nombre,
          observacion
        ),
      ]

      return {
        ...s,
        estado: nuevoEstado,
        motivoRechazo: ESTADOS_CON_MOTIVO.includes(nuevoEstado)
          ? observacion || s.motivoRechazo
          : s.motivoRechazo,
        historial,
      }
    }),
  }))
},

  cambiarEstadoAlcalde: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => {
    // TODO: Replace with API call PATCH /api/v1/requests/:id/status
    set(state => ({
      solicitudes: state.solicitudes.map(s => {
        if (s.id !== id || !isValidTransition(ESTADO_TRANSITIONS_ALCALDE, s.estado, nuevoEstado)) {
          return s
        }

        return {
          ...s,
          estado: nuevoEstado,
          motivoRechazo: ESTADOS_CON_MOTIVO.includes(nuevoEstado) ? observacion || s.motivoRechazo : s.motivoRechazo,
          historial: [
            ...s.historial,
            createHistorialEntry(nuevoEstado, userId, userName, s.departamento?.nombre, observacion),
          ],
        }
      }),
    }))
  },

  aprobarDepartamento: (id: string, userId: string, userName: string) => {
  get().cambiarEstadoDepartamento(id, 'approved_by_department', userId, userName)
  get().cambiarEstadoAlcalde(id, 'awaiting_mayor_signature', userId, userName)
  },

  aprobar: (id: string, userId: string, userName: string) => {
    get().cambiarEstadoAlcalde(id, 'signed', userId, userName)
  },

  declinar: (id: string, motivo: string, userId: string, userName: string) => {
    const solicitud = get().getSolicitudById(id)
    if (!solicitud) return

    if (ESTADOS_DEPARTAMENTO_PENDIENTES.includes(solicitud.estado)) {
      get().cambiarEstadoDepartamento(id, 'rejected_by_department', userId, userName, motivo)
      return
    }

    get().cambiarEstadoAlcalde(id, 'rejected_by_mayor_office', userId, userName, motivo)
  },

  cambiarEstado: (id: string, nuevoEstado: SolicitudEstado, userId: string, userName: string, observacion?: string) => {
    const solicitud = get().getSolicitudById(id)
    if (!solicitud) return

    if (isValidTransition(ESTADO_TRANSITIONS_DEPARTAMENTO, solicitud.estado, nuevoEstado)) {
      get().cambiarEstadoDepartamento(id, nuevoEstado, userId, userName, observacion)
      return
    }

    get().cambiarEstadoAlcalde(id, nuevoEstado, userId, userName, observacion)
  },

  cambiarDepartamento: (id: string, nuevoDepartamentoId: string, userId: string, userName: string, motivo?: string) => {
    // TODO: Replace with API call PATCH /api/v1/requests/:id/departamento
    const nuevoDepartamento = mockDepartamentos[nuevoDepartamentoId]

    set(state => ({
      solicitudes: state.solicitudes.map(s => {
        if (s.id !== id) return s

        const oldDep = s.departamento?.nombre || 'Sin departamento'
        const newDep = nuevoDepartamento?.nombre || 'Sin departamento'
        const debeAsignar = s.estado === 'received' && Boolean(nuevoDepartamentoId)
        const historialEntry: HistorialEntry = debeAsignar
          ? createHistorialEntry('assigned_to_department', userId, userName, newDep)
          : {
              id: `h-${Date.now()}`,
              fecha: new Date().toISOString(),
              accion: s.estado,
              descripcion: `Departamento cambiado de ${oldDep} a ${newDep}${motivo ? `. Motivo: ${motivo}` : ''}`,
              usuario: userName,
              usuarioId: userId,
            }

        return {
          ...s,
          departamentoId: nuevoDepartamentoId,
          departamento: nuevoDepartamento,
          estado: debeAsignar ? 'assigned_to_department' : s.estado,
          historial: [...s.historial, historialEntry],
        }
      }),
    }))
  },

  addSolicitud: (solicitud: NewSolicitudData): Solicitud => {
    // TODO: Replace with API call POST /api/v1/requests
    const ids = get().solicitudes.map(s => Number.parseInt(s.id, 10)).filter(Number.isFinite)
    const nextId = Math.max(...ids) + 1
    const departamento = solicitud.departamentoId ? mockDepartamentos[solicitud.departamentoId] : undefined
    const now = new Date().toISOString()
    const fechaSolicitud = solicitud.fechaSolicitud || now.split('T')[0]
    const tieneDepartamento = Boolean(solicitud.departamentoId && departamento)
    const estadoInicial: SolicitudEstado = tieneDepartamento ? 'assigned_to_department' : 'received'

    const historial: HistorialEntry[] = [
      {
        id: `h-${Date.now()}`,
        fecha: now,
        accion: 'received',
        descripcion: buildHistorialDescripcion('received', solicitud.subidoPor),
        usuario: solicitud.subidoPor,
        usuarioId: solicitud.subidoPorId,
      },
    ]

    if (tieneDepartamento) {
      historial.push({
        id: `h-${Date.now() + 1}`,
        fecha: now,
        accion: 'assigned_to_department',
        descripcion: buildHistorialDescripcion('assigned_to_department', solicitud.subidoPor, departamento?.nombre),
        usuario: solicitud.subidoPor,
        usuarioId: solicitud.subidoPorId,
      })
    }

    const newSolicitud: Solicitud = {
      id: String(nextId),
      radicado: `#${nextId}`,
      titulo: solicitud.titulo,
      categoria: solicitud.categoria,
      departamentoId: solicitud.departamentoId,
      departamento,
      fechaSolicitud: fechaSolicitud,
      fechaLimite: solicitud.fechaLimite,
      solicitante: solicitud.solicitante,
      identificacion: solicitud.identificacion,
      descripcion: solicitud.descripcion,
      estado: estadoInicial,
      prioridad: 'MEDIUM',
      subidoPor: solicitud.subidoPor,
      subidoPorId: solicitud.subidoPorId,
      documento: solicitud.documento,
      historial,
    }

    set(state => ({
      solicitudes: [newSolicitud, ...state.solicitudes],
    }))

    return newSolicitud
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
