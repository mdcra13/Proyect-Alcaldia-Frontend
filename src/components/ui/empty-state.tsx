import { FileText, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({
  icon: Icon = FileText,
  title = 'No hay datos',
  description = 'No se encontraron registros para mostrar.',
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  )
}