import React from "react"
import {
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap"

/**
 * Componente genérico de paginação para tabelas
 * @param {Object} props
 * @param {number} props.currentPage - Página atual
 * @param {number} props.totalPages - Total de páginas
 * @param {Array<number>} props.pageNumbers - Números das páginas visíveis
 * @param {boolean} props.hasMore - Se há mais dados para carregar
 * @param {Function} props.onPageChange - Callback para mudança de página
 */
export const TablePagination = ({
  currentPage,
  totalPages,
  pageNumbers,
  hasMore = false,
  onPageChange,
}) => {
  if (totalPages <= 1) return null

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div>
        Página {currentPage} de {totalPages}
      </div>
      <Pagination className="mb-0">
        <PaginationItem disabled={currentPage === 1}>
          <PaginationLink
            previous
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            aria-label="Página anterior"
          />
        </PaginationItem>

        {pageNumbers.map(page => (
          <PaginationItem key={page} active={currentPage === page}>
            <PaginationLink
              onClick={() => onPageChange(page)}
              aria-label={`Ir para página ${page}`}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem disabled={currentPage === totalPages && !hasMore}>
          <PaginationLink
            next
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Próxima página"
          />
        </PaginationItem>
      </Pagination>
    </div>
  )
}
