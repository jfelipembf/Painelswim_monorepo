import React from "react"
import { Table } from "reactstrap"

/**
 * Componente genérico para estados de carregamento de tabelas
 * @param {Object} props
 * @param {Array} props.columns - Colunas da tabela
 * @param {string} props.message - Mensagem de carregamento
 */
export const TableLoadingState = ({ columns = [], message = "Carregando..." }) => (
  <div className="table-responsive">
    <Table className="table align-middle table-nowrap mb-0">
      <thead className="table-light">
        <tr>
          {columns.map((column, index) => (
            <th key={column.key || `col-${index}`}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={columns.length + 1} className="text-center py-4">
            {message}
          </td>
        </tr>
      </tbody>
    </Table>
  </div>
)

/**
 * Componente genérico para estados vazios de tabelas
 * @param {Object} props
 * @param {Array} props.columns - Colunas da tabela
 * @param {string} props.message - Mensagem quando vazio
 */
export const TableEmptyState = ({ columns = [], message = "Nenhum item encontrado." }) => (
  <div className="table-responsive">
    <Table className="table align-middle table-nowrap mb-0">
      <thead className="table-light">
        <tr>
          {columns.map((column, index) => (
            <th key={column.key || `col-${index}`}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={columns.length + 1} className="text-center py-4 text-muted">
            <i className="mdi mdi-database-off display-4" />
            <p className="mt-2">{message}</p>
          </td>
        </tr>
      </tbody>
    </Table>
  </div>
)
