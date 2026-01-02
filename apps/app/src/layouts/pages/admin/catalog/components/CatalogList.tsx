import { useMemo } from "react";

import AppBar from "@mui/material/AppBar";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Icon from "@mui/material/Icon";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import DataTable from "examples/Tables/DataTable";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { CatalogItem, CatalogTab } from "../types";

type CatalogListProps = {
  tab: CatalogTab;
  items: CatalogItem[];
  loading: boolean;
  error?: string | null;
  onTabChange: (tab: CatalogTab) => void;
  onEdit: (item: CatalogItem) => void;
  onDelete: (item: CatalogItem) => void;
};

function CatalogList({
  tab,
  items,
  loading,
  error,
  onTabChange,
  onEdit,
  onDelete,
}: CatalogListProps): JSX.Element {
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
      [...items]
        .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
        .map((item) => {
          const inactive = Boolean(item?.inactive);

          return {
            name: (
              <MDTypography variant="button" fontWeight="medium">
                {item?.name || "—"}
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
                  onClick={() => onEdit(item)}
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
                  onClick={() => onDelete(item)}
                >
                  <Icon fontSize="small">delete</Icon>
                </MDButton>
              </MDBox>
            ),
          };
        }),
    [items, onDelete, onEdit]
  );

  const tabValue = tab === "products" ? 0 : 1;

  return (
    <MDBox>
      <MDBox mb={2}>
        <AppBar position="static">
          <Tabs
            value={tabValue}
            onChange={(_, value) => onTabChange(value === 0 ? "products" : "services")}
          >
            <Tab label="Produtos" />
            <Tab label="Serviços" />
          </Tabs>
        </AppBar>
      </MDBox>

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
    </MDBox>
  );
}

export default CatalogList;
