import { create } from 'zustand'
import type { Departamento } from '@/lib/types'

const mockDepartamentos: Departamento[] = [
  {
    id: 'dep-1',
    nombre: 'Salud',
    descripcion: 'Departamento encargado de solicitudes relacionadas con salud.',
    activo: true,
  },
  {
    id: 'dep-2',
    nombre: 'Educación',
    descripcion: 'Departamento encargado de solicitudes educativas.',
    activo: true,
  },
  {
    id: 'dep-3',
    nombre: 'Obras Públicas',
    descripcion: 'Departamento encargado de infraestructura y obras municipales.',
    activo: true,
  },
  {
    id: 'dep-4',
    nombre: 'Desarrollo Social',
    descripcion: 'Departamento encargado de programas de apoyo social.',
    activo: true,
  },
  {
    id: 'dep-5',
    nombre: 'Alcaldía',
    descripcion: 'Despacho de la Alcaldía Municipal.',
    activo: true,
  },
  {
    id: 'dep-6',
    nombre: 'Hacienda',
    descripcion: 'Departamento encargado de gestión financiera municipal.',
    activo: true,
  },
]

interface DepartamentoFormData {
  nombre: string
  descripcion?: string
}

interface DepartamentosState {
  departamentos: Departamento[]
  getDepartamentosActivos: () => Departamento[]
  addDepartamento: (data: DepartamentoFormData) => Departamento
  updateDepartamento: (
    id: string,
    updates: Partial<Pick<Departamento, 'nombre' | 'descripcion'>>
  ) => void
  toggleDepartamentoActivo: (id: string) => void
  getDepartamentoById: (id: string) => Departamento | undefined
}

const useDepartamentosStore = create<DepartamentosState>((set, get) => ({
  departamentos: mockDepartamentos,

  getDepartamentosActivos: (): Departamento[] => {
    // TODO: Replace mock active departments with GET /api/v1/departamentos when backend is ready.
    return get().departamentos.filter(departamento => departamento.activo)
  },

  addDepartamento: (data: DepartamentoFormData): Departamento => {
    // TODO: Replace mock department creation with POST /api/v1/departamentos when backend is ready.
    const nextId = `dep-${Date.now()}`
    const departamento: Departamento = {
      id: nextId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      activo: true,
    }

    set(state => ({
      departamentos: [...state.departamentos, departamento],
    }))

    return departamento
  },

  updateDepartamento: (
    id: string,
    updates: Partial<Pick<Departamento, 'nombre' | 'descripcion'>>
  ) => {
    // TODO: Replace mock department update with PATCH /api/v1/departamentos/:id when backend is ready.
    set(state => ({
      departamentos: state.departamentos.map(departamento =>
        departamento.id === id ? { ...departamento, ...updates } : departamento
      ),
    }))
  },

  toggleDepartamentoActivo: (id: string) => {
    // TODO: Replace mock department status update with PATCH /api/v1/departamentos/:id when backend is ready.
    set(state => ({
      departamentos: state.departamentos.map(departamento =>
        departamento.id === id
          ? { ...departamento, activo: !departamento.activo }
          : departamento
      ),
    }))
  },

  getDepartamentoById: (id: string): Departamento | undefined => {
    // TODO: Replace mock department lookup with GET /api/v1/departamentos/:id when backend is ready.
    return get().departamentos.find(departamento => departamento.id === id)
  },
}))

export default useDepartamentosStore
