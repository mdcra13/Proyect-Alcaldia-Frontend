interface SolicitudesTableHeaderProps {
  showFechaIngreso?: boolean
}

export default function SolicitudesTableHeader({
  showFechaIngreso = false,
}: SolicitudesTableHeaderProps) {
  return (
    <thead className="border-b bg-muted/50">
      <tr>
        <th className="p-4 text-left font-medium text-muted-foreground">Radicado</th>
        <th className="p-4 text-left font-medium text-muted-foreground">Título</th>
        <th className="hidden p-4 text-left font-medium text-muted-foreground md:table-cell">
          Solicitante
        </th>
        {showFechaIngreso && (
          <th className="p-4 text-left font-medium text-muted-foreground">Fecha ingreso</th>
        )}
        <th className="p-4 text-left font-medium text-muted-foreground">Fecha límite</th>
        <th className="p-4 text-left font-medium text-muted-foreground">Estado</th>
        <th className="p-4 text-right font-medium text-muted-foreground">Acciones</th>
      </tr>
    </thead>
  )
}