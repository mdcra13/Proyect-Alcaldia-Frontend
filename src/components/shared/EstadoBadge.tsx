import { ESTADO_CONFIG } from '@/lib/types'
import type { SolicitudEstado } from '@/lib/types'
import { cn } from '@/lib/utils'

interface EstadoBadgeProps {
  estado: SolicitudEstado
  className?: string
  variant?: 'compact' | 'detail'
}

const variantClasses = {
  compact: 'px-2 py-0.5 text-xs',
  detail: 'px-3 py-1.5 text-sm',
}

export function EstadoBadge({
  estado,
  className,
  variant = 'compact',
}: EstadoBadgeProps) {
  const config = ESTADO_CONFIG[estado]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.color,
        variantClasses[variant],
        className
      )}
    >
      {config.label}
    </span>
  )
}

export default EstadoBadge