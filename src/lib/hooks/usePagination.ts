import { useEffect, useMemo } from 'react'

interface UsePaginationOptions<T> {
  items: T[]
  itemsPerPage?: number
  currentPage: number
  onPageChange: (page: number) => void
}

export default function usePagination<T>({
  items,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
}: UsePaginationOptions<T>) {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      onPageChange(safeCurrentPage)
    }
  }, [currentPage, safeCurrentPage, onPageChange])

  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  )

  return {
    paginatedItems,
    totalItems,
    totalPages,
    currentPage: safeCurrentPage,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: endIndex,
  }
}