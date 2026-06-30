import { useMemo } from 'react'

export function usePaginatedList<T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
) {
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedItems = useMemo(
    () =>
      items.slice(
        (safeCurrentPage - 1) * itemsPerPage,
        safeCurrentPage * itemsPerPage
      ),
    [items, safeCurrentPage, itemsPerPage]
  )

  return { totalPages, safeCurrentPage, paginatedItems }
}