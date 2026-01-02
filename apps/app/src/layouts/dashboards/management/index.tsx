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
import Icon from "@mui/material/Icon";
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
import TopPlansChart from "layouts/dashboards/management/components/TopPlansChart";

// Sales dashboard components
import { Portuguese } from "flatpickr/dist/l10n/pt";

import { useManagementDashboard } from "hooks/clients";
import { buildWaveBackground } from "layouts/pages/touch/utils";

type SummaryCard = {
  title: string;
  value: number;
  previousValue: number;
  formatter?: (value: number) => string;
};

const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function Management(): JSX.Element {
  const { data, loading, error, selectedDate, setSelectedDate } = useManagementDashboard();

  const accessCount = data?.metrics?.accessCount ?? 0;
  const accessLastHourCount = data?.metrics?.accessLastHourCount ?? 0;
  const activeStudents = data?.metrics?.activeStudents ?? 0;
  const newStudents = data?.metrics?.newStudents ?? 0;
  const suspendedStudents = data?.metrics?.suspendedStudents ?? 0;
  const cancellations = data?.metrics?.cancellations ?? 0;
  const churnPercent = data?.metrics?.churnPercent ?? 0;
  const renewals = data?.metrics?.renewals ?? 0;

  const activeByPlan = data?.charts?.activeByPlan || {
    labels: [],
    datasets: { label: "Planos", data: [], backgroundColors: [] },
  };

  const cancellationsHistory = data?.charts?.cancellationsHistory || {
    labels: [],
    datasets: [],
  };

  const previousMetrics = data?.previousMetrics;

  const summaryCards: SummaryCard[] = [
    { title: "Ativos", value: activeStudents, previousValue: previousMetrics?.activeStudents ?? 0 },
    {
      title: "Novos alunos",
      value: newStudents,
      previousValue: previousMetrics?.newStudents ?? 0,
    },
    {
      title: "Alunos suspensos",
      value: suspendedStudents,
      previousValue: previousMetrics?.suspendedStudents ?? 0,
    },
    {
      title: "Cancelamentos",
      value: cancellations,
      previousValue: previousMetrics?.cancellations ?? 0,
    },
    {
      title: "Churn",
      value: churnPercent,
      previousValue: previousMetrics?.churnPercent ?? 0,
      formatter: (value) => `${value}%`,
    },
    {
      title: "Renovações",
      value: renewals,
      previousValue: previousMetrics?.renewals ?? 0,
    },
  ];

  const accessByDay = data?.charts?.accessByDay || {
    labels: weekdayLabels,
    datasets: [
      {
        label: "Acesso do dia (semana selecionada)",
        data: Array.from({ length: 7 }, () => 0),
        color: "secondary" as const,
      },
      {
        label: "Média por dia (últimos 4 meses)",
        data: Array.from({ length: 7 }, () => 0),
        color: "info" as const,
      },
    ],
  };

  const selectedDateKey = data?.dateKey ?? String(selectedDate.toISOString()).slice(0, 10);
  const todayKey = String(new Date().toISOString()).slice(0, 10);
  const isToday = selectedDateKey === todayKey;
  const accessHighlight = isToday ? accessLastHourCount : accessCount;
  const accessHighlightLabel = isToday
    ? "Clientes na academia na última hora"
    : "Clientes presentes no dia";
  const accessDateLabel = "Semana selecionada";

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
        <DashboardWrapper loading={loading} error={error} title="métricas">
          <MDBox mb={3}>
            <Grid container spacing={3}>
              {summaryCards.map((card) => {
                const value = Number(card.value) || 0;
                const previousValue = Number(card.previousValue) || 0;
                const displayValue = card.formatter
                  ? card.formatter(value)
                  : value.toLocaleString("pt-BR");
                const displayPreviousValue = card.formatter
                  ? card.formatter(previousValue)
                  : previousValue.toLocaleString("pt-BR");
                const improvement =
                  previousValue > 0
                    ? Math.round(((value - previousValue) / previousValue) * 100)
                    : 0;
                const isPositive = improvement >= 0;
                const improvementLabel = `${isPositive ? "+" : ""}${improvement}%`;

                return (
                  <Grid item xs={12} sm={6} lg={4} key={card.title}>
                    <MDBox mb={1.5}>
                      <Card sx={glassCardSx}>
                        <MDBox p={2.5} display="flex" flexDirection="column" height="100%">
                          <MDBox>
                            <MDTypography
                              variant="button"
                              fontWeight="medium"
                              sx={{ opacity: 0.8 }}
                            >
                              {card.title}
                            </MDTypography>
                            <MDBox display="flex" alignItems="baseline" gap={0.75} flexWrap="wrap">
                              <MDTypography variant="caption" color="text" sx={{ opacity: 0.6 }}>
                                Mês anterior
                              </MDTypography>
                              <MDTypography variant="caption" fontWeight="bold" color="text">
                                {displayPreviousValue}
                              </MDTypography>
                              <MDTypography
                                variant="caption"
                                fontWeight="bold"
                                sx={(theme: Theme) => ({
                                  color: isPositive
                                    ? theme.palette.success.main
                                    : theme.palette.error.main,
                                })}
                              >
                                {improvementLabel}
                              </MDTypography>
                            </MDBox>
                          </MDBox>
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
              <Grid item xs={12} sm={6} lg={4}>
                <Card sx={glassCardSx}>
                  <MDBox p={2} display="flex" alignItems="center" justifyContent="space-between">
                    <MDBox display="flex" alignItems="center" gap={1}>
                      <Icon color="action">bar_chart</Icon>
                      <MDTypography variant="h6">Acessos por dia da semana</MDTypography>
                    </MDBox>
                    <MDTypography variant="button" color="info" fontWeight="medium">
                      {accessDateLabel}
                    </MDTypography>
                  </MDBox>
                  <MDBox px={2} pb={2}>
                    <MDBox mb={2} display="flex" alignItems="baseline" gap={1.5} flexWrap="wrap">
                      <MDTypography variant="h3" fontWeight="bold" sx={{ lineHeight: 1 }}>
                        {accessHighlight}
                      </MDTypography>
                      <MDTypography variant="button" color="text" sx={{ opacity: 0.7 }}>
                        {accessHighlightLabel}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2} display="flex" justifyContent="center" gap={3} flexWrap="wrap">
                      <MDBox display="flex" alignItems="center" gap={1}>
                        <MDBox
                          width={10}
                          height={10}
                          borderRadius="50%"
                          sx={(theme: Theme) => ({ backgroundColor: theme.palette.secondary.main })}
                        />
                        <MDTypography variant="caption" color="text">
                          Acesso do dia (semana selecionada)
                        </MDTypography>
                      </MDBox>
                      <MDBox display="flex" alignItems="center" gap={1}>
                        <MDBox
                          width={10}
                          height={10}
                          borderRadius="50%"
                          sx={(theme: Theme) => ({ backgroundColor: theme.palette.info.main })}
                        />
                        <MDTypography variant="caption" color="text">
                          Média por dia (últimos 4 meses)
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                    <ActiveMembersChart chart={accessByDay} height="14rem" smooth />
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <TopPlansChart
                  title="Alunos ativos por plano"
                  description="Distribuição dos alunos ativos por plano no período selecionado."
                  chart={activeByPlan}
                  cardSx={glassCardSx}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <ActiveMembersChart
                  title="Cancelamentos"
                  description="Cancelamentos registrados por dia no período selecionado."
                  chart={cancellationsHistory}
                  height="20rem"
                  cardSx={glassCardSx}
                  smooth
                />
              </Grid>
            </Grid>
          </MDBox>
        </DashboardWrapper>
      </MDBox>
    </DashboardLayout>
  );
}

export default Management;
