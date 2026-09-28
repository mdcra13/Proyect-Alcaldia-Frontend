import { getDiasRestantes, getUrgenciaLevel } from '@/lib/stores/solicitudesStore'
import type { UrgenciaLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FechaLimiteBadgeProps {
  fechaLimite: string
  className?: string
  showDate?: boolean
}

const urgenciaConfig: Record<UrgenciaLevel, { color: string; bgColor: string }> = {
  vencida: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  urgente: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  proxima: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  normal: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
}

const indicatorColor: Record<UrgenciaLevel, string> = {
  vencida: 'text-red-500',
  urgente: 'text-orange-500',
  proxima: 'text-yellow-500',
  normal: 'text-green-500',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getFechaLimiteText(
  fechaLimite: string,
  urgencia: UrgenciaLevel,
  diasRestantes: number
): string {
  if (urgencia === 'vencida') {
    const diasVencidos = Math.abs(diasRestantes)
    return diasVencidos === 1
      ? 'Vencida hace 1 día'
      : `Vencida hace ${diasVencidos} días`
  }

  if (diasRestantes === 0) return 'Vence hoy'

  if (urgencia === 'urgente' || urgencia === 'proxima') {
    return diasRestantes === 1
      ? 'Vence en 1 día'
      : `Vence en ${diasRestantes} días`
  }

  return formatDate(fechaLimite)
}

export function FechaLimiteBadge({
  fechaLimite,
  className,
  showDate = false,
}: FechaLimiteBadgeProps) {
  const urgencia = getUrgenciaLevel(fechaLimite)
  const diasRestantes = getDiasRestantes(fechaLimite)
  const config = urgenciaConfig[urgencia]
  const text = getFechaLimiteText(fechaLimite, urgencia, diasRestantes)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <span className={cn('text-[10px] leading-none', indicatorColor[urgencia])}>●</span>
      <span>{showDate && urgencia !== 'normal' ? `${text} · ${formatDate(fechaLimite)}` : text}</span>
    </span>
  )
}

export function FechaLimiteBadgeCompact({
  fechaLimite,
  className,
}: Omit<FechaLimiteBadgeProps, 'showDate'>) {
  return <FechaLimiteBadge fechaLimite={fechaLimite} className={className} />
}

export default FechaLimiteBadge