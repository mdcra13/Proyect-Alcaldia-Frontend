import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import useDepartamentosStore from '@/lib/stores/departamentosStore'
import type { UserRole } from '@/lib/types'

const ROLE_LABELS: Record<UserRole, string> = {
    secretaria:   'Secretaria',
    funcionario:  'Funcionario de Departamento',
    departamento: 'Jefe de Departamento',
    alcalde:      'Alcalde',
    it:           'Operador IT',
}

export interface UserFormData {
    nombre: string
    apellido: string
    username: string
    role: UserRole | ''
    departamentoId: string
    password: string
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

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',')

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
    const dialogRef     = useRef<HTMLDivElement>(null)
    const onCloseRef    = useRef(onClose)
    const previouslyFocused = useRef<HTMLElement | null>(null)

useEffect(() => { onCloseRef.current = onClose }, [onClose])

useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null

    const dialog = dialogRef.current
    const focusable = dialog
        ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : []
    ;(focusable[0] ?? dialog)?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation()
            onCloseRef.current()
        return
        }
        if (e.key !== 'Tab' || !dialogRef.current) return

        const els = Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter(el => el.offsetParent !== null || el === document.activeElement)

        if (els.length === 0) { e.preventDefault(); dialogRef.current.focus(); return }

        const first = els[0]
        const last  = els[els.length - 1]

        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        if (!e.shiftKey && document.activeElement === last)  { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
        document.removeEventListener('keydown', handleKeyDown)
        previouslyFocused.current?.focus()
    }
}, [isOpen])

    if (!isOpen) return null

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            aria-describedby="user-modal-desc"
            tabIndex={-1}
            className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl"
        >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
                <h2 id="user-modal-title" className="font-serif text-xl font-semibold text-foreground">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <p id="user-modal-desc" className="sr-only">
                {isEditing
                    ? 'Formulario para editar los datos de un usuario existente.'
                    : 'Formulario para crear un nuevo usuario en el sistema.'}
                </p>
            </div>

            {!isEditing && (
                <div>
                <label htmlFor="user-password" className="mb-1 block text-sm font-medium text-foreground">
                    Contraseña temporal *
                </label>
                <input
                    id="user-password"
                    type="password"
                    value={formData.password}
                    onChange={e => onFormDataChange({ ...formData, password: e.target.value })}
                    minLength={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
                </div>
            )}
            <button
                type="button"
                onClick={onClose}
                className="icon-button hover:bg-secondary"
                aria-label="Cerrar modal"
            >
                <X className="h-5 w-5" aria-hidden="true" focusable="false" />
            </button>
            </div>

            <div className="space-y-4 p-6">
            {formError && (
                <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                {formError}
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                <label htmlFor="user-nombre" className="mb-1 block text-sm font-medium text-foreground">
                    Nombre *
                </label>
                <input
                    id="user-nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={e => onFormDataChange({ ...formData, nombre: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
                </div>
                <div>
                <label htmlFor="user-apellido" className="mb-1 block text-sm font-medium text-foreground">
                    Apellido *
                </label>
                <input
                    id="user-apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={e => onFormDataChange({ ...formData, apellido: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
                </div>
            </div>

            <div>
                <label htmlFor="user-username" className="mb-1 block text-sm font-medium text-foreground">
                Usuario *
                </label>
                <input
                id="user-username"
                type="text"
                value={formData.username}
                onChange={e => onFormDataChange({ ...formData, username: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
            </div>

            <div>
                <label htmlFor="user-role" className="mb-1 block text-sm font-medium text-foreground">
                Rol *
                </label>
                <select
                id="user-role"
                value={formData.role}
                onChange={e => onFormDataChange({ ...formData, role: e.target.value as UserRole, departamentoId: '' })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                >
                <option value="">Seleccionar rol</option>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
                </select>
            </div>

            {(formData.role === 'funcionario' || formData.role === 'departamento') && (
                <div>
                <label htmlFor="user-departamentoId" className="mb-1 block text-sm font-medium text-foreground">
                    Departamento *
                </label>
                <select
                    id="user-departamentoId"
                    value={formData.departamentoId}
                    onChange={e => onFormDataChange({ ...formData, departamentoId: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                >
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
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
