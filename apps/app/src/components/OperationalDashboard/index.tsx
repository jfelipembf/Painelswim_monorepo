import Grid from "@mui/material/Grid";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useDashboard } from "hooks/clients";

import QuickStatsGrid, { QuickStatCard } from "./components/QuickStatsGrid";
import ResultsCard, { ResultCard } from "./components/ResultsCard";
import MessagesCard, { MessageItem } from "./components/MessagesCard";
import TasksCard from "./components/TasksCard";

type Props = {
  embedded?: boolean;
};

const formatCurrency = (value: number): string =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function OperationalDashboard({ embedded = false }: Props): JSX.Element {
  const { data, loading, error } = useDashboard();

  const quickStats: QuickStatCard[] = [
    {
      label: "Tarefas do dia",
      value: 0,
      color: "info",
      actionLabel: "Ver tarefas",
    },
    {
      label: "Aniversariantes",
      value: 0,
      color: "warning",
      actionLabel: "Ver lista",
    },
    {
      label: "Vencimento de contratos",
      value: 0,
      color: "error",
      actionLabel: "Ver detalhes",
    },
  ];

  const resultCards: ResultCard[] = [
    {
      label: "Vendas",
      value: (data?.metrics?.totalSalesCents ?? 0) / 100,
      target: 5000,
      suffix: "",
      formatter: formatCurrency,
      subtitle: "Total vendido",
      improvementPercent: 12,
    },
    {
      label: "Alunos ativos",
      value: data?.metrics?.activeStudents ?? 0,
      target: 120,
      suffix: "",
      subtitle: "Base atual",
      improvementPercent: 4,
    },
    {
      label: "Novos alunos",
      value: data?.metrics?.newClients ?? 0,
      target: 20,
      suffix: "",
      subtitle: "Entradas recentes",
      improvementPercent: -3,
    },
  ];

  const messages: MessageItem[] = [
    {
      id: "default-1",
      title: "Sem avisos",
      description: "Nenhuma mensagem operacional registrada hoje.",
      createdAt: new Date().toLocaleDateString("pt-BR"),
    },
  ];

  return (
    <MDBox>
      <MDBox px={embedded ? 0 : 2}>
        {(loading || error) && (
          <MDBox mb={2}>
            {loading && (
              <MDTypography variant="button" color="text">
                Carregando métricas operacionais...
              </MDTypography>
            )}
            {error && (
              <MDTypography variant="button" color="error" fontWeight="medium">
                {error}
              </MDTypography>
            )}
          </MDBox>
        )}

        <QuickStatsGrid items={quickStats} />

        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={7}>
            <TasksCard embedded={embedded} />
          </Grid>

          <Grid item xs={12} md={5}>
            <ResultsCard items={resultCards} />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  );
}

export default OperationalDashboard;
