import { X } from 'lucide-react'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { UserRole } from '@/lib/types'

const ROLE_LABELS: Record<UserRole, string> = {
    secretaria: 'Secretaria',
    departamento: 'Jefe de Departamento',
    alcalde: 'Alcalde',
    it: 'Operador IT',
}

export interface UserFormData {
    nombre: string
    apellido: string
    username: string
    role: UserRole | ''
    departamentoId: string
}

interface UserFormModalProps {
    isOpen: boolean
    isEditing: boolean
    formData: UserFormData
    formError: string
    onClose: () => void
    onSubmit: () => void
    onFormDataChange: (data: UserFormData) => void
}

export default function UserFormModal({
    isOpen,
    isEditing,
    formData,
    formError,
    onClose,
    onSubmit,
    onFormDataChange,
    }: UserFormModalProps) {
    const departamentos = useDepartamentosStore(state => state.departamentos)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-serif text-xl font-semibold text-foreground">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            <button
                type="button"
                onClick={onClose}
                className="icon-button hover:bg-secondary"
                aria-label="Cerrar modal"
            >
                <X className="h-5 w-5" />
            </button>
            </div>

            <div className="space-y-4 p-6">
            {formError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                <label
                    htmlFor="nombre"
                    className="mb-1 block text-sm font-medium text-foreground"
                >
                    Nombre *
                </label>

                <input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={event =>
                    onFormDataChange({
                        ...formData,
                        nombre: event.target.value,
                    })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
                </div>

                <div>
                <label
                    htmlFor="apellido"
                    className="mb-1 block text-sm font-medium text-foreground"
                >
                    Apellido *
                </label>

                <input
                    id="apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={event =>
                    onFormDataChange({
                        ...formData,
                        apellido: event.target.value,
                    })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
                </div>
            </div>

            <div>
                <label
                htmlFor="username"
                className="mb-1 block text-sm font-medium text-foreground"
                >
                Usuario *
                </label>

                <input
                id="username"
                type="text"
                value={formData.username}
                onChange={event =>
                    onFormDataChange({
                    ...formData,
                    username: event.target.value,
                    })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
            </div>

            <div>
                <label
                htmlFor="role"
                className="mb-1 block text-sm font-medium text-foreground"
                >
                Rol *
                </label>

                <select
                id="role"
                value={formData.role}
                onChange={event =>
                    onFormDataChange({
                    ...formData,
                    role: event.target.value as UserRole,
                    departamentoId: '',
                    })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                >
                <option value="">Seleccionar rol</option>

                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                    {label}
                    </option>
                ))}
                </select>
            </div>

            {formData.role === 'departamento' && (
                <div>
                <label
                    htmlFor="departamentoId"
                    className="mb-1 block text-sm font-medium text-foreground"
                >
                    Departamento *
                </label>

                <select
                    id="departamentoId"
                    value={formData.departamentoId}
                    onChange={event =>
                    onFormDataChange({
                        ...formData,
                        departamentoId: event.target.value,
                    })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                >
                    <option value="">Seleccionar departamento</option>

                    {departamentos.map(departamento => (
                    <option key={departamento.id} value={departamento.id}>
                        {departamento.nombre}
                    </option>
                    ))}
                </select>
                </div>
            )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
                Cancelar
            </button>

            <button
                type="button"
                onClick={onSubmit}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
                {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
            </div>
        </div>
        </div>
    )
    }