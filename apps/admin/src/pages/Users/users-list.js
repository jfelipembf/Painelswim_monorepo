import React, { useMemo, useEffect } from "react"
import { Alert, Card, CardBody, Col, Row } from "reactstrap"
import { Link } from "react-router-dom"

import { SearchBar } from "../../components/Common/SearchBar"
import { DataTable } from "../../components/Common/DataTable"
import { TablePagination } from "../../components/Common/TablePagination"
import ConfirmDeleteModal from "../../components/Common/ConfirmDeleteModal"

import { useTableData } from "../../hooks/ui/useTableData"
import { useSearchFilter } from "../../hooks/ui/useSearchFilter"
import { useUsersTableProvider } from "./hooks/useUsersTableProvider"
import { USERS_TABLE_COLUMNS } from "./constants/userTableColumns"

export const UsersList = () => {
  const tableState = useTableData(useUsersTableProvider)
  const {
    members,
    membersLoading,
    membersLoaded,
    membersError,
    hasMore,
    loadMembers,
    handleAction,
    deleteModal,
    closeDeleteModal,
    handleConfirmDelete,
    deleting,
  } = tableState

  // Hook para busca, filtros e paginação
  const searchState = useSearchFilter(members, ["fullName", "email", "phone"], {
    hasMore,
    loadMore: loadMembers,
  })

  const tableColumns = useMemo(() => USERS_TABLE_COLUMNS, [])

  // Inicializar carregamento automático (similar ao código original)
  useEffect(() => {
    if (!membersLoaded) {
      loadMembers()
    }
  }, [loadMembers, membersLoaded])



  return (
    <>
      <Row>
        <Col lg={12}>
          <Card className="mb-4">
            <CardBody>
              {/* Barra de busca reutilizável */}
              <SearchBar
                searchTerm={searchState.searchTerm}
                onSearchChange={searchState.setSearchTerm}
                pageSize={searchState.pageSize}
                onPageSizeChange={searchState.setPageSize}
                loading={membersLoading}
                placeholder="Buscar usuário por nome, e-mail ou telefone"
                actions={
                  <Link to="/users/new" className="btn btn-primary">
                    Adicionar
                  </Link>
                }
              />

              {/* Exibir erros se houver */}
              {membersError && (
                <Alert color="danger" className="mb-4">
                  {membersError.message || "Não foi possível carregar os membros."}
                </Alert>
              )}

              {/* Tabela genérica com dados paginados */}
              <DataTable
                data={searchState.paginatedData}
                columns={tableColumns}
                loading={membersLoading}
                loaded={membersLoaded}
                emptyMessage="Nenhum membro encontrado."
                onAction={handleAction}
                rowKey="id"
              />

              {/* Paginação reutilizável */}
              <TablePagination
                currentPage={searchState.currentPage}
                totalPages={searchState.totalPages}
                pageNumbers={searchState.pageNumbers}
                hasMore={hasMore}
                onPageChange={searchState.setCurrentPage}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal de exclusão reutilizável */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        loading={deleting}
        title="Excluir Usuário"
        message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
      />
    </>
  )
}

export default UsersList
