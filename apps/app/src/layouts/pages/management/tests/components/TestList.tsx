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

import type { TestItem, TestTabMode } from "../types";

type TestListProps = {
  tests: TestItem[];
  loading: boolean;
  error?: string | null;
  tab: TestTabMode;
  onTabChange: (tab: TestTabMode) => void;
  onEdit: (test: TestItem) => void;
  onDelete: (test: TestItem) => void;
};

function TestList({
  tests,
  loading,
  error,
  tab,
  onTabChange,
  onEdit,
  onDelete,
}: TestListProps): JSX.Element {
  const filteredTests = useMemo(() => tests.filter((test) => test.mode === tab), [tests, tab]);

  const columns = useMemo(
    () => [
      { Header: "nome", accessor: "name", width: "60%" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      [...filteredTests]
        .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
        .map((test) => {
          const inactive = Boolean(test?.inactive);

          return {
            name: (
              <MDTypography variant="button" fontWeight="medium">
                {test?.name || "—"}
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
                  onClick={() => onEdit(test)}
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
                  onClick={() => onDelete(test)}
                >
                  <Icon fontSize="small">delete</Icon>
                </MDButton>
              </MDBox>
            ),
          };
        }),
    [filteredTests, onDelete, onEdit]
  );

  const tabValue = tab === "distance" ? 0 : 1;

  return (
    <MDBox>
      <MDBox mb={2}>
        <AppBar position="static">
          <Tabs
            value={tabValue}
            onChange={(_, value) => onTabChange(value === 0 ? "distance" : "time")}
          >
            <Tab label="Distância" />
            <Tab label="Tempo" />
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

export default TestList;
