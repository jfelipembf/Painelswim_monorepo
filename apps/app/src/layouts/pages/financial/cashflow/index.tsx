import { useMemo } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDDatePicker from "components/MDDatePicker";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 PRO React TS examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

import { useCashFlow } from "hooks/clients";

import { Portuguese } from "flatpickr/dist/l10n/pt";
import { formatCentsBRL } from "utils/currency";

import { CASHFLOW_TABLE_COLUMNS } from "./constants";
import { buildChartData, exportCashflowReport } from "./utils";

function CashFlowPage(): JSX.Element {
  const { data, loading, error, selectedRange, setSelectedRange } = useCashFlow();

  const handleExport = () => {
    if (typeof window === "undefined") return;
    if (!data) return;
    exportCashflowReport(data);
  };

  const totals = useMemo(() => {
    const incomeCents = Number(data?.totals?.incomeCents || 0);
    const expenseCents = Number(data?.totals?.expenseCents || 0);
    const netCents = Number(data?.totals?.netCents || 0);
    return { incomeCents, expenseCents, netCents };
  }, [data?.totals?.expenseCents, data?.totals?.incomeCents, data?.totals?.netCents]);

  const chartData = useMemo(() => buildChartData(data?.chart || []), [data?.chart]);

  const rows = useMemo(
    () =>
      (data?.chart || []).map((h) => ({
        date: (
          <MDTypography variant="caption" fontWeight="medium">
            {String(h.dateKey || "")}
          </MDTypography>
        ),
        description: (
          <MDTypography variant="button" fontWeight="regular">
            Resumo do dia
          </MDTypography>
        ),
        category: (
          <MDTypography variant="caption" fontWeight="medium" color="text">
            Financeiro
          </MDTypography>
        ),
        value: (
          <MDTypography variant="button" fontWeight="bold" color="info">
            {formatCentsBRL(Number(h.incomeCents || 0) - Number(h.expenseCents || 0))}
          </MDTypography>
        ),
      })),
    [data?.chart]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" fontWeight="bold">
            Fluxo de Caixa
          </MDTypography>
          <MDBox display="flex" gap={2}>
            <MDBox sx={{ width: 170 }}>
              <MDDatePicker
                value={selectedRange?.start ? [selectedRange.start] : []}
                options={{ dateFormat: "d/m/Y", locale: Portuguese }}
                onChange={(dates: any[]) => {
                  const next = dates?.[0];
                  if (next instanceof Date && !Number.isNaN(next.getTime())) {
                    setSelectedRange((prev) => ({ ...prev, start: next }));
                  }
                }}
                input={{ label: "Início", fullWidth: true }}
              />
            </MDBox>
            <MDBox sx={{ width: 170 }}>
              <MDDatePicker
                value={selectedRange?.end ? [selectedRange.end] : []}
                options={{ dateFormat: "d/m/Y", locale: Portuguese }}
                onChange={(dates: any[]) => {
                  const next = dates?.[0];
                  if (next instanceof Date && !Number.isNaN(next.getTime())) {
                    setSelectedRange((prev) => ({ ...prev, end: next }));
                  }
                }}
                input={{ label: "Fim", fullWidth: true }}
              />
            </MDBox>
            <MDButton
              variant="gradient"
              color="info"
              startIcon={<Icon>print</Icon>}
              onClick={handleExport}
              disabled={!data}
            >
              Exportar Relatório
            </MDButton>
          </MDBox>
        </MDBox>

        {(loading || error) && (
          <MDBox mb={2} px={2}>
            {loading ? (
              <MDTypography variant="button" color="text" fontWeight="regular">
                Carregando fluxo de caixa…
              </MDTypography>
            ) : null}
            {error ? (
              <MDTypography variant="button" color="error" fontWeight="medium">
                {error}
              </MDTypography>
            ) : null}
          </MDBox>
        )}

        <Grid container spacing={3}>
          {/* Statistics Cards */}
          <Grid item xs={12} md={6} lg={4}>
            <ComplexStatisticsCard
              icon="arrow_upward"
              color="secondary"
              title="Receitas (7 dias)"
              count={formatCentsBRL(totals.incomeCents)}
              percentage={{
                color: "secondary",
                amount: "",
                label: "",
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <ComplexStatisticsCard
              icon="arrow_downward"
              color="secondary"
              title="Despesas (7 dias)"
              count={formatCentsBRL(totals.expenseCents)}
              percentage={{
                color: "secondary",
                amount: "",
                label: "",
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <ComplexStatisticsCard
              icon="account_balance_wallet"
              color="secondary"
              title="Saldo Líquido"
              count={formatCentsBRL(totals.netCents)}
              percentage={{
                color: "secondary",
                amount: "",
                label: "",
              }}
            />
          </Grid>

          {/* Chart */}
          <Grid item xs={12}>
            <DefaultLineChart
              icon={{ color: "secondary", component: "show_chart" }}
              title="Evolução Financeira"
              description="Comparativo de receitas, despesas e resultado no período"
              chart={chartData}
            />
          </Grid>

          {/* Detailed Table */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3} pb={0}>
                <MDTypography variant="h6" fontWeight="medium">
                  Histórico de Fechamentos
                </MDTypography>
              </MDBox>
              <MDBox p={3}>
                <DataTable
                  table={{ columns: CASHFLOW_TABLE_COLUMNS, rows }}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                  entriesPerPage={false}
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default CashFlowPage;
