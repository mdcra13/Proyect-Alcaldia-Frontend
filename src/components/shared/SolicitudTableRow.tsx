import type { ReactNode } from 'react'
import type { Solicitud } from '@/lib/types'
import { EstadoBadge } from '@/components/shared/EstadoBadge'
import { FechaLimiteBadge } from '@/components/shared/FechaLimiteBadge'
import { decodeText } from '@/lib/utils'

interface SolicitudTableRowProps {
  solicitud: Solicitud
  fechaIngresoFormatted?: string
  actions: ReactNode
}

export default function SolicitudTableRow({
  solicitud,
  fechaIngresoFormatted,
  actions,
}: SolicitudTableRowProps) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/30">
      <th scope="row" className="p-4 text-left font-normal">
        <span className="font-mono text-sm">{solicitud.radicado}</span>
      </th>

      <td className="p-4">
        <p className="max-w-55 truncate font-medium">{solicitud.titulo}</p>
      </td>

      <td className="hidden p-4 md:table-cell">
        <span className="text-sm">{decodeText(solicitud.solicitante)}</span>
      </td>

      {fechaIngresoFormatted && (
        <td className="p-4 text-sm">{fechaIngresoFormatted}</td>
      )}

      <td className="p-4">
        <FechaLimiteBadge fechaLimite={solicitud.fechaLimite} />
      </td>

      <td className="p-4">
        <EstadoBadge estado={solicitud.estado} />
      </td>

      <td className="p-4">
        <div className="flex items-center justify-end gap-1">{actions}</div>
      </td>
    </tr>
  )
}
