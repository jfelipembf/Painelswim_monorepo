import React from "react"
import { Table } from "reactstrap"
import { TableLoadingState, TableEmptyState } from "./TableStates"

/**
 * Componente genérico de tabela com colunas dinâmicas
 * @param {Object} props
 * @param {Array} props.data - Dados da tabela
 * @param {Array} props.columns - Configuração das colunas
 * @param {boolean} props.loading - Estado de carregamento
 * @param {boolean} props.loaded - Se os dados foram carregados
 * @param {string} props.emptyMessage - Mensagem quando vazio
 * @param {string} props.loadingMessage - Mensagem quando carregando
 * @param {Function} props.onAction - Callback para ações (editar, excluir, etc.)
 * @param {string} props.rowKey - Propriedade para chave única das linhas
 */
export const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  loaded = true,
  emptyMessage = "Nenhum item encontrado.",
  loadingMessage = "Carregando...",
  onAction,
  rowKey = "id",
}) => {
  // Estado de carregamento inicial
  if (!loaded && loading) {
    return <TableLoadingState columns={columns} message={loadingMessage} />
  }

  // Estado vazio
  if (!data || data.length === 0) {
    return <TableEmptyState columns={columns} message={emptyMessage} />
  }

  return (
    <div className="table-responsive">
      <Table className="table align-middle table-nowrap mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column, index) => (
              <th key={column.key || `header-${index}`}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item[rowKey] || item.slug || `row-${index}`}>
              {columns.map((column, colIndex) => (
                <td key={column.key || `cell-${index}-${colIndex}`}>
                  {column.render
                    ? column.render(item, index, onAction)
                    : item[column.key] || "—"
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
