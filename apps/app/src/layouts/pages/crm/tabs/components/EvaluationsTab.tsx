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

type EvaluationStatus = "done" | "pending";

function EvaluationsTab(): JSX.Element {
  const navigate = useNavigate();

  const evaluationsOptions = useMemo<any[]>((): any[] => [], []);
  const [evaluationId, setEvaluationId] = useState<string>("");
  const [evaluationStatusFilter, setEvaluationStatusFilter] = useState<EvaluationStatus | "">("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<
    "active" | "inactive" | "paused" | ""
  >("");

  const data = useMemo<any[]>(() => [], []);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (
        evaluationId &&
        r.evaluationName !== evaluationsOptions.find((e: any) => e.value === evaluationId)?.label
      )
        return false;
      if (evaluationStatusFilter && r.evaluationStatus !== evaluationStatusFilter) return false;
      if (memberStatusFilter && r.memberStatus !== memberStatusFilter) return false;
      return true;
    });
  }, [data, evaluationId, evaluationStatusFilter, evaluationsOptions, memberStatusFilter]);

  const columns = useMemo(
    () => [
      {
        Header: "aluno",
        accessor: "name",
        width: "30%",
        Cell: ({ value: [name, data] }: any) => <NameCell image={data.image} name={name} />,
      },
      { Header: "avaliação", accessor: "evaluation" },
      { Header: "status da avaliação", accessor: "evaluationStatus", align: "center" },
      { Header: "status do aluno", accessor: "memberStatus", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      filtered.map((r) => ({
        name: [r.name, { image: r.image }],
        evaluation: r.evaluationName,
        evaluationStatus: (
          <MDBadge
            variant="contained"
            color={r.evaluationStatus === "done" ? "success" : "warning"}
            badgeContent={r.evaluationStatus === "done" ? "Realizada" : "Não realizada"}
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
            Avaliações
          </MDTypography>

          <MDBox mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6} lg={4}>
                <FormField
                  label="Avaliação"
                  select
                  value={evaluationId}
                  onChange={(e: any) => setEvaluationId(String(e?.target?.value || ""))}
                >
                  <MenuItem value="">Selecione</MenuItem>
                </FormField>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <FormField
                  label="Status da avaliação"
                  select
                  value={evaluationStatusFilter}
                  onChange={(e: any) =>
                    setEvaluationStatusFilter(String(e?.target?.value || "") as any)
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="done">Realizada</MenuItem>
                  <MenuItem value="pending">Não realizada</MenuItem>
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

export default EvaluationsTab;
