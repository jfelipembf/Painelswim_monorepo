import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import MenuItem from "@mui/material/MenuItem";

import DataTable from "examples/Tables/DataTable";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

import { STATUS_LABELS } from "constants/status";

import NameCell from "layouts/pages/clients/clientList/components/NameCell";
import { FormField } from "components";

type TestStatus = "done" | "pending";

function TestsTab(): JSX.Element {
  const navigate = useNavigate();

  const testsOptions = useMemo<any[]>((): any[] => [], []);
  const [testId, setTestId] = useState<string>("");
  const [testStatusFilter, setTestStatusFilter] = useState<TestStatus | "">("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<
    "active" | "inactive" | "paused" | ""
  >("");

  const data = useMemo(() => [] as any[], []);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (testId && r.testName !== testsOptions.find((t: any) => t.value === testId)?.label)
        return false;
      if (testStatusFilter && r.testStatus !== testStatusFilter) return false;
      if (memberStatusFilter && r.memberStatus !== memberStatusFilter) return false;
      return true;
    });
  }, [data, memberStatusFilter, testId, testStatusFilter, testsOptions]);

  const columns = useMemo(
    () => [
      {
        Header: "aluno",
        accessor: "name",
        width: "30%",
        Cell: ({ value: [name, data] }: any) => <NameCell image={data.image} name={name} />,
      },
      { Header: "teste", accessor: "test" },
      { Header: "status do teste", accessor: "testStatus", align: "center" },
      { Header: "status do aluno", accessor: "memberStatus", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      filtered.map((r) => ({
        name: [r.name, { image: r.image }],
        test: r.testName,
        testStatus: (
          <MDBadge
            variant="contained"
            color={r.testStatus === "done" ? "success" : "warning"}
            badgeContent={r.testStatus === "done" ? "Realizado" : "Não realizado"}
            container
          />
        ),
        memberStatus: (
          <MDBadge
            variant="contained"
            color={
              r.memberStatus === "active"
                ? "success"
                : r.memberStatus === "paused"
                ? "warning"
                : "error"
            }
            badgeContent={STATUS_LABELS[r.memberStatus as keyof typeof STATUS_LABELS]}
            container
          />
        ),
        actions: (
          <MDButton
            variant="outlined"
            color="info"
            iconOnly
            onClick={() => navigate(`/clients/profile/${r.id}`)}
          >
            <Icon>visibility</Icon>
          </MDButton>
        ),
      })),
    [filtered, navigate]
  );

  return (
    <MDBox>
      <Card>
        <MDBox p={3}>
          <MDTypography variant="h6" fontWeight="medium">
            Testes
          </MDTypography>

          <MDBox mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6} lg={4}>
                <FormField
                  label="Teste"
                  select
                  value={testId}
                  onChange={(e: any) => setTestId(String(e?.target?.value || ""))}
                >
                  <MenuItem value="">Selecione</MenuItem>
                </FormField>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <FormField
                  label="Status do teste"
                  select
                  value={testStatusFilter}
                  onChange={(e: any) => setTestStatusFilter(String(e?.target?.value || "") as any)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="done">Realizado</MenuItem>
                  <MenuItem value="pending">Não realizado</MenuItem>
                </FormField>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <FormField
                  label="Status do aluno"
                  select
                  value={memberStatusFilter}
                  onChange={(e: any) =>
                    setMemberStatusFilter(String(e?.target?.value || "") as any)
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="paused">Pausado</MenuItem>
                  <MenuItem value="inactive">Inativo</MenuItem>
                </FormField>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <MDButton variant="gradient" color="info" fullWidth>
                  Buscar
                </MDButton>
              </Grid>
            </Grid>
          </MDBox>

          <MDBox mt={3}>
            <DataTable
              table={{ columns, rows }}
              entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
              showTotalEntries
              canSearch
              labels={{
                entriesPerPage: "registros por página",
                searchPlaceholder: "Pesquisar aluno...",
                totalEntries: (start, end, total) =>
                  `Mostrando ${start} até ${end} de ${total} registros`,
              }}
              isSorted
              noEndBorder
            />
          </MDBox>
        </MDBox>
      </Card>
    </MDBox>
  );
}

export default TestsTab;
