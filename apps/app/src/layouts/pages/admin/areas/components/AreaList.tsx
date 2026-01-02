import { useMemo } from "react";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Icon from "@mui/material/Icon";

import DataTable from "examples/Tables/DataTable";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { AreaItem } from "../types";

type AreaListProps = {
  areas: AreaItem[];
  loading: boolean;
  error?: string | null;
  onEdit: (area: AreaItem) => void;
  onDelete: (area: AreaItem) => void;
};

function AreaList({ areas, loading, error, onEdit, onDelete }: AreaListProps): JSX.Element {
  const columns = useMemo(
    () => [
      { Header: "nome", accessor: "name", width: "55%" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      [...areas]
        .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
        .map((area) => {
          const inactive = Boolean(area?.inactive);

          return {
            name: (
              <MDTypography variant="button" fontWeight="medium">
                {area?.name || "—"}
              </MDTypography>
            ),
            status: (
              <MDTypography
                variant="button"
                fontWeight="medium"
                color={inactive ? "secondary" : "success"}
              >
                {inactive ? "Inativo" : "Ativo"}
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
                  onClick={() => onEdit(area)}
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
                  onClick={() => onDelete(area)}
                >
                  <Icon fontSize="small">delete</Icon>
                </MDButton>
              </MDBox>
            ),
          };
        }),
    [areas, onDelete, onEdit]
  );

  return (
    <Card sx={{ overflow: "visible" }}>
      <MDBox pb={2} px={2} pt={2}>
        {loading ? (
          <MDBox display="flex" justifyContent="center" py={6}>
            <CircularProgress color="info" />
          </MDBox>
        ) : error ? (
          <MDBox py={2}>
            <MDTypography variant="button" color="error" fontWeight="medium">
              {error}
            </MDTypography>
          </MDBox>
        ) : (
          <DataTable
            table={{ columns, rows }}
            entriesPerPage={false}
            showTotalEntries={false}
            isSorted={false}
            noEndBorder
          />
        )}
      </MDBox>
    </Card>
  );
}

export default AreaList;
