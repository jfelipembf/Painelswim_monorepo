import React, { useEffect, useMemo } from "react";
import { Alert, Card, CardBody, Col, Row } from "reactstrap";
import { Link, useLocation } from "react-router-dom";

import { SearchBar } from "../../components/Common/SearchBar";
import { DataTable } from "../../components/Common/DataTable";
import { TablePagination } from "../../components/Common/TablePagination";
import ConfirmDeleteModal from "../../components/Common/ConfirmDeleteModal";

import { useTableData } from "../../hooks/ui/useTableData";
import { useSearchFilter } from "../../hooks/ui/useSearchFilter";
import { useBranches } from "../../hooks/clients/useBranches";

const useQuery = () => new URLSearchParams(useLocation().search);

const useBranchesTableProvider = () => {
  const query = useQuery();
  const tenantId = query.get("tenantId") || "";
  const { loadBranches } = useBranches();

  return async () => {
    const data = await loadBranches({ tenantId });
    return { data: data || [], hasMore: false };
  };
};

const BRANCHES_TABLE_COLUMNS = [
  {
    key: "name",
    label: "Filial",
    render: (item) => <Link to={`/branches/${item.id}`}>{item.name}</Link>,
  },
  { key: "tenantId", label: "Tenant" },
  { key: "status", label: "Status" },
];

export const BranchesList = () => {
  const query = useQuery();
  const tenantId = query.get("tenantId") || "";
  const tableState = useTableData(useBranchesTableProvider);
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

  const searchState = useSearchFilter(members, ["name", "tenantId"], {
    hasMore,
    loadMore: loadMembers,
  });

  const tableColumns = useMemo(() => BRANCHES_TABLE_COLUMNS, []);

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
                placeholder="Buscar filial por nome"
                actions={
                  <Link to={`/branches/new${tenantId ? `?tenantId=${tenantId}` : ""}`} className="btn btn-primary">
                    Nova filial
                  </Link>
                }
              />

              <DataTable
                data={searchState.paginatedData}
                columns={tableColumns}
                loading={membersLoading}
                loaded={membersLoaded}
                emptyMessage="Nenhuma filial encontrada."
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
        title="Excluir filial"
        message="Tem certeza que deseja excluir esta filial?"
      />
    </>
  );
};

export default BranchesList;
