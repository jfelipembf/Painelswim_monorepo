import { useMemo } from "react";

import Icon from "@mui/material/Icon";

import DataTable from "examples/Tables/DataTable";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { Contract } from "hooks/contracts";

type Props = {
  contracts: Contract[];
  isSaving: boolean;
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
};

function ContractsTable({ contracts, isSaving, onEdit, onDelete }: Props): JSX.Element {
  const columns = useMemo(
    () => [
      { Header: "nome", accessor: "name", width: "55%" },
      { Header: "preço", accessor: "price", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      [...contracts]
        .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
        .map((contract) => ({
          name: (
            <MDTypography variant="button" fontWeight="medium">
              {contract?.name || "—"}
            </MDTypography>
          ),
          price: (
            <MDTypography variant="button" fontWeight="medium" color="text">
              {(Number(contract?.priceCents || 0) / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </MDTypography>
          ),
          actions: (
            <MDBox display="flex" justifyContent="center" gap={1}>
              <MDButton
                variant="outlined"
                color="info"
                size="small"
                iconOnly
                circular
                title="Editar"
                onClick={() => onEdit(contract)}
                disabled={isSaving}
              >
                <Icon fontSize="small">edit</Icon>
              </MDButton>
              <MDButton
                variant="outlined"
                color="error"
                size="small"
                iconOnly
                circular
                title="Excluir"
                onClick={() => onDelete(contract)}
                disabled={isSaving}
              >
                <Icon fontSize="small">delete</Icon>
              </MDButton>
            </MDBox>
          ),
        })),
    [contracts, isSaving, onDelete, onEdit]
  );

  return (
    <DataTable
      table={{ columns, rows }}
      entriesPerPage={false}
      showTotalEntries={false}
      isSorted={false}
      noEndBorder
    />
  );
}

export default ContractsTable;
