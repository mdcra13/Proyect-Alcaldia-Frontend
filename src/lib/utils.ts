import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Solicitud } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
const CATEGORIA_LABELS: Record<string, string> = {
  salud: 'Salud',
  educacion: 'Educación',
  familiar: 'Familiar',
  comunidad: 'Comunidad',
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  aprobado: 'Aprobado',
  declinado: 'Declinado',
}

export function exportToCSV(solicitudes: Solicitud[], filename = 'solicitudes.csv'): void {
  const headers = ['# Radicado', 'Solicitante', 'Categoría', 'Fecha', 'Subido por', 'Estado']

  const rows = solicitudes.map(s => [
    s.radicado,
    s.solicitante,
    CATEGORIA_LABELS[s.categoria] ?? s.categoria,
    s.fechaIngreso,
    s.subidoPor,
    ESTADO_LABELS[s.estado] ?? s.estado,
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
