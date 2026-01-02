/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import type { Theme } from "@mui/material/styles";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDDatePicker from "components/MDDatePicker";
import MDTypography from "components/MDTypography";
import DashboardWrapper from "components/DashboardWrapper";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ActiveMembersChart from "layouts/dashboards/management/components/ActiveMembersChart";
import VerticalBarChart from "examples/Charts/BarCharts/VerticalBarChart";

import { Portuguese } from "flatpickr/dist/l10n/pt";

import { useFinancialDashboard } from "hooks/clients";
import { buildWaveBackground } from "layouts/pages/touch/utils";

type SummaryCard = {
  title: string;
  value: number;
  formatter?: (value: number) => string;
  comparison?: {
    label: string;
    value: number;
  };
};

const formatCurrencyCents = (value: number): string =>
  (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Financial(): JSX.Element {
  const { data, loading, error, selectedDate, setSelectedDate } = useFinancialDashboard();

  const salesMonthToDateCents = data?.metrics?.salesMonthToDateCents ?? 0;
  const salesPreviousMonthToDateCents = data?.metrics?.salesPreviousMonthToDateCents ?? 0;
  const expensesMonthToDateCents = data?.metrics?.expensesMonthToDateCents ?? 0;
  const salesTodayCents = data?.metrics?.salesTodayCents ?? 0;

  const incomeExpenseHistory = data?.charts?.incomeExpenseHistory || {
    labels: [],
    datasets: [],
  };

  const salesGrossMonthOverMonth = data?.charts?.salesGrossMonthOverMonth || {
    labels: [],
    datasets: [],
  };

  const summaryCards: SummaryCard[] = [
    {
      title: "Vendas (Mês até hoje)",
      value: salesMonthToDateCents,
      formatter: formatCurrencyCents,
      comparison: {
        label: "Mês anterior (mesmo período)",
        value: salesPreviousMonthToDateCents,
      },
    },
    {
      title: "Despesas (Mês)",
      value: expensesMonthToDateCents,
      formatter: formatCurrencyCents,
    },
    {
      title: "Vendas (Hoje)",
      value: salesTodayCents,
      formatter: formatCurrencyCents,
    },
  ];

  const glassCardSx = (theme: Theme) => ({
    position: "relative",
    overflow: "hidden",
    height: "100%",
    minHeight: 190,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(10px)",
    backgroundImage: `linear-gradient(135deg, rgba(26, 115, 232, 0.06), rgba(0, 0, 0, 0) 55%), ${buildWaveBackground()}`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <DashboardWrapper loading={loading} error={error} title="métricas financeiras">
          <MDBox mb={3}>
            <Grid container spacing={3}>
              {summaryCards.map((card) => {
                const value = Number(card.value) || 0;
                const displayValue = card.formatter
                  ? card.formatter(value)
                  : value.toLocaleString("pt-BR");

                return (
                  <Grid item xs={12} sm={6} lg={4} key={card.title}>
                    <MDBox mb={1.5}>
                      <Card sx={glassCardSx}>
                        <MDBox p={2.5} display="flex" flexDirection="column" height="100%">
                          <MDTypography variant="button" fontWeight="medium" sx={{ opacity: 0.8 }}>
                            {card.title}
                          </MDTypography>
                          {card.comparison ? (
                            <MDTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                              {card.comparison.label}:{" "}
                              {card.formatter
                                ? card.formatter(card.comparison.value)
                                : card.comparison.value.toLocaleString("pt-BR")}
                            </MDTypography>
                          ) : null}
                          <MDBox mt="auto" textAlign="right">
                            <MDTypography
                              variant="h4"
                              fontWeight="bold"
                              sx={(theme: Theme) => ({ color: theme.palette.grey[700] })}
                            >
                              {displayValue}
                            </MDTypography>
                          </MDBox>
                        </MDBox>
                      </Card>
                    </MDBox>
                  </Grid>
                );
              })}
            </Grid>
          </MDBox>

          <MDBox mb={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ActiveMembersChart
                  title="Recebimentos x gastos"
                  description="Recebimentos e despesas no mês até a data selecionada."
                  chart={incomeExpenseHistory}
                  height="20rem"
                  cardSx={glassCardSx}
                  smooth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <VerticalBarChart
                  title="Vendas (Bruto) - mês a mês"
                  description="Comparativo mês a mês com o mesmo período do ano anterior."
                  chart={salesGrossMonthOverMonth}
                  height="20rem"
                  cardSx={glassCardSx}
                />
              </Grid>
            </Grid>
          </MDBox>
        </DashboardWrapper>
      </MDBox>
    </DashboardLayout>
  );
}

export default Financial;
