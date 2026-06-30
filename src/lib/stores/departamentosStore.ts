import { create } from 'zustand'
import { backendApi, mapBackendDepartment } from '@/lib/api/backend'
import type { Departamento } from '@/lib/types'

interface DepartamentoFormData {
  nombre: string
  descripcion?: string
}

interface DepartamentosState {
  departamentos: Departamento[]
  fetchDepartamentos: () => Promise<void>
  getDepartamentosActivos: () => Departamento[]
  addDepartamento: (data: DepartamentoFormData) => Promise<Departamento>
  updateDepartamento: (
    id: string,
    updates: Partial<Pick<Departamento, 'nombre' | 'descripcion' | 'activo'>>
  ) => Promise<Departamento>
  toggleDepartamentoActivo: (id: string) => Promise<Departamento>
  getDepartamentoById: (id: string) => Departamento | undefined
}

const useDepartamentosStore = create<DepartamentosState>((set, get) => ({
  departamentos: [],

  fetchDepartamentos: async () => {
    const departments = await backendApi.departments()
    set({ departamentos: departments.map(mapBackendDepartment) })
  },

  getDepartamentosActivos: () =>
    get().departamentos.filter(departamento => departamento.activo),

  addDepartamento: async data => {
    const created = mapBackendDepartment(await backendApi.createDepartment(data))
    set(state => ({ departamentos: [...state.departamentos, created] }))
    return created
  },

  updateDepartamento: async (id, updates) => {
    const updated = mapBackendDepartment(await backendApi.updateDepartment(id, updates))
    set(state => ({
      departamentos: state.departamentos.map(departamento =>
        departamento.id === id ? updated : departamento
      ),
    }))
    return updated
  },

  toggleDepartamentoActivo: async id => {
    const departamento = get().departamentos.find(item => item.id === id)
    if (!departamento) throw new Error('Departamento no encontrado')
    return get().updateDepartamento(id, { activo: !departamento.activo })
  },

  getDepartamentoById: id =>
    get().departamentos.find(departamento => departamento.id === id),
}))

export default useDepartamentosStore
