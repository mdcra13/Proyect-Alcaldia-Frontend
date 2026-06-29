import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Building2,
  Edit2,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import AppLayout from '@/components/layout/AppLayout'
import AccessibleDialog from '@/components/shared/AccessibleDialog'
import useAuthStore from '@/lib/stores/authStore'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { Departamento } from '@/lib/types'

interface DepartamentoFormState {
  nombre: string
  descripcion: string
  activo: boolean
}

const initialFormState: DepartamentoFormState = {
  nombre: '',
  descripcion: '',
  activo: true,
}

export default function ITGestionDepartamentos() {
  const users = useAuthStore(state => state.users)
  const {
    departamentos,
    addDepartamento,
    updateDepartamento,
    toggleDepartamentoActivo,
  } = useDepartamentosStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null)
  const [formData, setFormData] = useState<DepartamentoFormState>(initialFormState)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const filteredDepartamentos = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return departamentos
    return departamentos.filter(departamento =>
      departamento.nombre.toLowerCase().includes(query)
    )
  }, [departamentos, searchTerm])

  const getAssignedUsersCount = (departamentoId: string) =>
    users.filter(user =>
      user.departamentoId === departamentoId && user.role === 'departamento'
    ).length

  const getActiveAssignedUsersCount = (departamentoId: string) =>
    users.filter(user =>
      user.departamentoId === departamentoId &&
      user.role === 'departamento' &&
      user.status === 'active'
    ).length

  const resetForm = () => {
    setFormData(initialFormState)
    setEditingDepartamento(null)
  }

  const handleOpenCreateModal = (trigger: HTMLButtonElement) => {
    triggerRef.current = trigger
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (departamento: Departamento, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger
    setEditingDepartamento(departamento)
    setFormData({
      nombre: departamento.nombre,
      descripcion: departamento.descripcion ?? '',
      activo: departamento.activo,
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
    triggerRef.current?.focus()
  }

  const handleToggleDepartamento = async (departamento: Departamento) => {
    const activeUsersCount = getActiveAssignedUsersCount(departamento.id)

    if (departamento.activo && activeUsersCount > 0) {
      toast.error(
        `No se puede desactivar ${departamento.nombre} porque tiene ${activeUsersCount} usuario(s) activo(s) asignado(s).`
      )
      return
    }

    try {
      await toggleDepartamentoActivo(departamento.id)
      toast.success('Estado del departamento actualizado.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el departamento.')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nombre = formData.nombre.trim()
    const descripcion = formData.descripcion.trim()

    if (!nombre) {
      toast.error('El nombre del departamento es obligatorio.')
      return
    }

    try {
      if (editingDepartamento) {
        await updateDepartamento(editingDepartamento.id, {
          nombre,
          descripcion: descripcion || undefined,
          activo: formData.activo,
        })
        toast.success('Departamento actualizado correctamente.')
      } else {
        await addDepartamento({
          nombre,
          descripcion: descripcion || undefined,
        })
        toast.success('Departamento creado correctamente.')
      }
      handleCloseModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el departamento.')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Gestion de Departamentos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Administra los departamentos disponibles en el sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={event => handleOpenCreateModal(event.currentTarget)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" focusable="false" />
            Nuevo departamento
          </button>
        </div>

        <section className="rounded-lg border border-border bg-card" aria-labelledby="dept-table-title">
          <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="dept-table-title" className="font-serif text-lg font-semibold text-foreground">
                Departamentos
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredDepartamentos.length} departamento(s) encontrado(s)
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <label htmlFor="dept-search" className="sr-only">
                Buscar departamento
              </label>
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
                focusable="false"
              />
              <input
                id="dept-search"
                type="search"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Listado de departamentos">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Nombre</th>
                  <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Descripcion</th>
                  <th scope="col" className="p-4 text-center font-medium text-muted-foreground">Usuarios asignados</th>
                  <th scope="col" className="p-4 text-center font-medium text-muted-foreground">Estado</th>
                  <th scope="col" className="p-4 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartamentos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      No se encontraron departamentos.
                    </td>
                  </tr>
                ) : (
                  filteredDepartamentos.map(departamento => {
                    const assignedUsersCount = getAssignedUsersCount(departamento.id)

                    return (
                      <tr
                        key={departamento.id}
                        className="border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building2
                              className="h-4 w-4 text-muted-foreground"
                              aria-hidden="true"
                              focusable="false"
                            />
                            <span className="font-medium text-foreground">
                              {departamento.nombre}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="max-w-md text-sm text-muted-foreground">
                            {departamento.descripcion || 'Sin descripcion'}
                          </p>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" focusable="false" />
                            {assignedUsersCount}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleDepartamento(departamento)}
                            aria-label={`${departamento.activo ? 'Desactivar' : 'Activar'} ${departamento.nombre}`}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition ${
                              departamento.activo
                                ? 'bg-success/10 text-success hover:bg-success/20'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {departamento.activo ? (
                              <ToggleRight className="h-4 w-4" aria-hidden="true" focusable="false" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" aria-hidden="true" focusable="false" />
                            )}
                            {departamento.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>

                        <td className="p-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={event => handleOpenEditModal(departamento, event.currentTarget)}
                              className="icon-button hover:bg-secondary"
                              aria-label={`Editar ${departamento.nombre}`}
                            >
                              <Edit2 className="h-4 w-4" aria-hidden="true" focusable="false" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {isModalOpen && (
          <AccessibleDialog
            titleId="departamento-modal-title"
            descriptionId="departamento-modal-desc"
            onClose={handleCloseModal}
            className="modal-card max-w-[520px]"
          >
            <div className="modal-header">
              <div>
                <h2
                  id="departamento-modal-title"
                  className="font-serif text-lg font-semibold text-foreground"
                >
                  {editingDepartamento ? 'Editar departamento' : 'Nuevo departamento'}
                </h2>
                <p id="departamento-modal-desc" className="mt-1 text-sm text-muted-foreground">
                  {editingDepartamento
                    ? 'Actualiza la informacion del departamento.'
                    : 'Registra un nuevo departamento en el sistema.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" aria-hidden="true" focusable="false" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 p-6">
                <div className="space-y-2">
                  <label htmlFor="dept-nombre" className="text-sm font-medium text-foreground">
                    Nombre *
                  </label>
                  <input
                    id="dept-nombre"
                    value={formData.nombre}
                    onChange={event =>
                      setFormData(current => ({
                        ...current,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Introduzca texto"
                    required
                    className="modal-form-field"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="dept-descripcion" className="text-sm font-medium text-foreground">
                    Descripcion
                  </label>
                  <textarea
                    id="dept-descripcion"
                    value={formData.descripcion}
                    onChange={event =>
                      setFormData(current => ({
                        ...current,
                        descripcion: event.target.value,
                      }))
                    }
                    placeholder="Area de texto opcional"
                    rows={4}
                    className="modal-form-field resize-none"
                  />
                </div>

                {editingDepartamento && (
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Estado</p>
                      <p className="text-xs text-muted-foreground">
                        Alternar activo/inactivo
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (formData.activo) {
                          const activeUsersCount = getActiveAssignedUsersCount(
                            editingDepartamento.id
                          )

                          if (activeUsersCount > 0) {
                            toast.error(
                              `No se puede desactivar ${editingDepartamento.nombre} porque tiene ${activeUsersCount} usuario(s) activo(s) asignado(s).`
                            )
                            return
                          }
                        }

                        setFormData(current => ({
                          ...current,
                          activo: !current.activo,
                        }))
                      }}
                      aria-label={`${formData.activo ? 'Desactivar' : 'Activar'} departamento`}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition ${
                        formData.activo
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {formData.activo ? (
                        <ToggleRight className="h-4 w-4" aria-hidden="true" focusable="false" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" aria-hidden="true" focusable="false" />
                      )}
                      {formData.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="modal-btn-cancel"
                >
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-primary">
                  {editingDepartamento ? 'Guardar cambios' : 'Crear departamento'}
                </button>
              </div>
            </form>
          </AccessibleDialog>
        )}
      </div>
    </AppLayout>
  )
}
