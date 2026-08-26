interface SolicitudesTableHeaderProps {
  showFechaIngreso?: boolean
}

export default function SolicitudesTableHeader({
  showFechaIngreso = false,
}: SolicitudesTableHeaderProps) {
  return (
    <thead className="border-b bg-muted/50">
      <tr>
        <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Código de seguimiento</th>
        <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Identificador</th>
        <th scope="col" className="hidden p-4 text-left font-medium text-muted-foreground md:table-cell">
          Solicitante
        </th>
        {showFechaIngreso && (
          <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Fecha ingreso</th>
        )}
        <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Fecha límite</th>
        <th scope="col" className="p-4 text-left font-medium text-muted-foreground">Estado</th>
        <th scope="col" className="p-4 text-right font-medium text-muted-foreground">Acciones</th>
      </tr>
    </thead>
  )
}
