import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems <= itemsPerPage) return null

  return (
    <div className="flex items-center justify-between border-t p-4">
      <p className="text-sm text-muted-foreground">
        Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
        {Math.min(currentPage * itemsPerPage, totalItems)} de{' '}
        {totalItems} notas
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm">
          Página {currentPage} de {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="icon-button border border-border hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}