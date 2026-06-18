import { create } from 'zustand'
import { api, toDepartamento } from '@/lib/api'
import type { Departamento } from '@/lib/types'

export const mockDepartamentos: Departamento[] = []

interface DepartamentoFormData {
  nombre: string
  descripcion?: string
}

interface DepartamentosState {
  departamentos: Departamento[]
  isLoading: boolean
  error: string | null
  fetchDepartamentos: () => Promise<void>
  getDepartamentosActivos: () => Departamento[]
  addDepartamento: (data: DepartamentoFormData) => Promise<Departamento>
  updateDepartamento: (
    id: string,
    updates: Partial<Pick<Departamento, 'nombre' | 'descripcion'>>
  ) => Promise<void>
  toggleDepartamentoActivo: (id: string) => void
  getDepartamentoById: (id: string) => Departamento | undefined
}

const useDepartamentosStore = create<DepartamentosState>((set, get) => ({
  departamentos: [],
  isLoading: false,
  error: null,

  fetchDepartamentos: async () => {
    set({ isLoading: true, error: null })

    try {
      const departamentos = (await api.departments()).map(toDepartamento)
      set({ departamentos, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los departamentos.',
      })
    }
  },

  getDepartamentosActivos: (): Departamento[] => {
    return get().departamentos.filter(departamento => departamento.activo)
  },

  addDepartamento: async (data: DepartamentoFormData): Promise<Departamento> => {
    const departamento: Departamento = {
      id: crypto.randomUUID(),
      nombre: data.nombre,
      descripcion: data.descripcion,
      activo: true,
    }

    set(state => ({
      departamentos: [...state.departamentos, departamento],
    }))

    return departamento
  },

  updateDepartamento: async (
    id: string,
    updates: Partial<Pick<Departamento, 'nombre' | 'descripcion'>>
  ) => {
    set(state => ({
      departamentos: state.departamentos.map(departamento =>
        departamento.id === id ? { ...departamento, ...updates } : departamento
      ),
    }))
  },

  toggleDepartamentoActivo: (id: string) => {
    set(state => ({
      departamentos: state.departamentos.map(departamento =>
        departamento.id === id
          ? { ...departamento, activo: !departamento.activo }
          : departamento
      ),
    }))
  },

  getDepartamentoById: (id: string): Departamento | undefined => {
    return get().departamentos.find(departamento => departamento.id === id)
  },
}))

export default useDepartamentosStore
