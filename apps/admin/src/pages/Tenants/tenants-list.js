import React, { useEffect, useMemo } from "react";
import { Alert, Card, CardBody, Col, Row } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";

import { SearchBar } from "../../components/Common/SearchBar";
import { DataTable } from "../../components/Common/DataTable";
import { TablePagination } from "../../components/Common/TablePagination";
import ConfirmDeleteModal from "../../components/Common/ConfirmDeleteModal";

import { useTableData } from "../../hooks/ui/useTableData";
import { useSearchFilter } from "../../hooks/ui/useSearchFilter";
import { useTenants } from "../../hooks/clients/useTenants";
import { TENANTS_TABLE_COLUMNS } from "./constants/tenantTableColumns";

const useTenantsTableProvider = () => {
  const { loadTenants } = useTenants();
  return async () => {
    const data = await loadTenants();
    return { data: data || [], hasMore: false };
  };
};

export const TenantsList = () => {
  const navigate = useNavigate();
  const tableState = useTableData(useTenantsTableProvider);
  const {
    members,
    membersLoading,
    membersLoaded,
    membersError,
    hasMore,
    loadMembers,
    deleteModal,
    closeDeleteModal,
    handleConfirmDelete,
    deleting,
  } = tableState;

  const searchState = useSearchFilter(members, ["name", "slug"], {
    hasMore,
    loadMore: loadMembers,
  });

  const tableColumns = useMemo(() => TENANTS_TABLE_COLUMNS, []);

  const handleAction = (action, item) => {
    if (action === "view") {
      navigate(`/tenants/${item.id}`);
    }
  };

  useEffect(() => {
    if (!membersLoaded) loadMembers();
  }, [loadMembers, membersLoaded]);

  return (
    <>
      <Row>
        <Col lg={12}>
          {membersError ? (
            <Alert color="danger" className="mb-3">
              {String(membersError?.message || membersError)}
            </Alert>
          ) : null}

          <Card className="mb-4">
            <CardBody>
              <SearchBar
                searchTerm={searchState.searchTerm}
                onSearchChange={searchState.setSearchTerm}
                pageSize={searchState.pageSize}
                onPageSizeChange={searchState.setPageSize}
                loading={membersLoading}
                placeholder="Buscar academia por nome ou slug"
                actions={
                  <Link to="/tenants/new" className="btn btn-primary" style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>
                    Nova academia
                  </Link>
                }
              />

              <DataTable
                data={searchState.paginatedData}
                columns={tableColumns}
                loading={membersLoading}
                loaded={membersLoaded}
                emptyMessage="Nenhuma academia encontrada."
                onAction={handleAction}
                rowKey="id"
              />

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

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        loading={deleting}
        title="Excluir academia"
        message="Tem certeza que deseja excluir esta academia?"
      />
    </>
  );
};

export default TenantsList;
