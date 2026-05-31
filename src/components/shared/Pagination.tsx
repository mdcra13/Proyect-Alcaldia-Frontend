import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  totalItems: number
  itemsPerPage?: number
  currentPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  totalItems,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems)

  if (totalItems === 0) return null

  return (
    <div className="pagination-wrapper">
      <p className="pagination-summary">
        Mostrando {startItem}-{endItem} de {totalItems} resultados
      </p>

      <div className="pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="pagination-btn"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Anterior</span>
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1
            const isActive = page === safeCurrentPage

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`pagination-btn ${isActive ? 'pagination-btn-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          className="pagination-btn"
          aria-label="Página siguiente"
        >
          <span>Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}