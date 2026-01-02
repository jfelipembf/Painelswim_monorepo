import React from "react"
import { Input, Spinner } from "reactstrap"

/**
 * Barra de busca genérica com seletor de tamanho de página
 * @param {Object} props
 * @param {string} props.searchTerm - Termo de busca atual
 * @param {Function} props.onSearchChange - Callback para mudança na busca
 * @param {number} props.pageSize - Tamanho da página atual
 * @param {Function} props.onPageSizeChange - Callback para mudança no tamanho da página
 * @param {boolean} props.loading - Indica se está carregando
 * @param {string} props.placeholder - Placeholder para o campo de busca
 * @param {Array<number>} props.pageSizeOptions - Opções de tamanho de página
 * @param {React.ReactNode} props.actions - Ações adicionais (botões, etc.)
 */
export const SearchBar = ({
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  loading = false,
  placeholder = "Buscar...",
  pageSizeOptions = [10, 25, 50, 100],
  actions,
}) => (
  <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-3">
    <div className="d-flex align-items-center gap-2">
      <span>Exibir</span>
      <Input
        type="select"
        value={pageSize}
        onChange={event => onPageSizeChange(Number(event.target.value))}
        style={{ width: 120 }}
        aria-label="Selecionar quantidade por página"
      >
        {pageSizeOptions.map(size => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Input>
      <span>por página</span>
    </div>

    <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ minWidth: 0 }}>
      <Input
        value={searchTerm}
        onChange={event => onSearchChange(event.target.value)}
        placeholder={placeholder}
        style={{ minWidth: 260 }}
        aria-label={placeholder}
      />
      {loading && <Spinner size="sm" color="primary" />}
      {actions}
    </div>
  </div>
)
