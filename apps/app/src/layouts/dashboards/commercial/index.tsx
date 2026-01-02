/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================
*/

// @mui material components
import { useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// MD components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Layout containers
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Comercial components
import KanbanBoard from "layouts/dashboards/commercial/components/kanban";

import MDDatePicker from "components/MDDatePicker";

import { Portuguese } from "flatpickr/dist/l10n/pt";

function Commercial(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const cutoffDateKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const periodLabel = useMemo(() => {
    const d = selectedDate;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear());
    return `01/${month}/${year} até ${day}/${month}/${year}`;
  }, [selectedDate]);

  const soldCount = 0;
  const soldNet = 0;
  const contactsCount = 0;
  const scheduledCount = 0;
  const attendanceCount = 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={2} px={2} display="flex" justifyContent="flex-end">
          <MDBox sx={{ width: 220 }}>
            <MDDatePicker
              value={selectedDate ? [selectedDate] : []}
              options={{
                dateFormat: "d/m/Y",
                locale: Portuguese,
              }}
              onChange={(dates: any[]) => {
                const next = dates?.[0];
                if (next instanceof Date && !Number.isNaN(next.getTime())) {
                  setSelectedDate(next);
                }
              }}
              input={{
                label: "Data (até)",
                fullWidth: true,
              }}
            />
          </MDBox>
        </MDBox>
        <MDBox mb={3}>
          <Card sx={{ height: "100%", width: "100%", overflow: "hidden" }}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" p={4}>
              {/* Contato */}
              <MDBox display="flex" flexDirection="column" alignItems="center" flex={1}>
                <MDBox
                  variant="gradient"
                  bgColor="dark"
                  color="white"
                  coloredShadow="dark"
                  borderRadius="xl"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="4rem"
                  height="4rem"
                  mb={2}
                >
                  <Icon fontSize="medium" color="inherit">
                    phone
                  </Icon>
                </MDBox>
                <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
                  Contato
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold" color="dark">
                  {contactsCount}
                </MDTypography>
              </MDBox>

              {/* Seta/Percentual entre Contato e Agendamento */}
              <MDBox display="flex" flexDirection="column" alignItems="center" mx={1} flex={0.5}>
                <MDTypography
                  variant="button"
                  fontWeight="regular"
                  color="text"
                  sx={{ fontSize: "0.75rem" }}
                >
                  —
                </MDTypography>
                <MDBox
                  display="flex"
                  alignItems="center"
                  width="100%"
                  sx={{ position: "relative", height: "20px" }}
                >
                  <Divider sx={{ width: "100%", borderColor: "#ced4da" }} />
                  <Icon
                    sx={{
                      position: "absolute",
                      right: 0,
                      color: "#ced4da",
                      transform: "translateY(-50%)",
                      top: "50%",
                    }}
                  >
                    arrow_forward
                  </Icon>
                </MDBox>
              </MDBox>

              {/* Agendamento */}
              <MDBox display="flex" flexDirection="column" alignItems="center" flex={1}>
                <MDBox
                  variant="gradient"
                  bgColor="info"
                  color="white"
                  coloredShadow="info"
                  borderRadius="xl"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="4rem"
                  height="4rem"
                  mb={2}
                >
                  <Icon fontSize="medium" color="inherit">
                    event
                  </Icon>
                </MDBox>
                <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
                  Agendamento
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold" color="info">
                  {scheduledCount}
                </MDTypography>
              </MDBox>

              {/* Seta/Percentual entre Agendamento e Presença */}
              <MDBox display="flex" flexDirection="column" alignItems="center" mx={1} flex={0.5}>
                <MDTypography
                  variant="button"
                  fontWeight="regular"
                  color="text"
                  sx={{ fontSize: "0.75rem" }}
                >
                  —
                </MDTypography>
                <MDBox
                  display="flex"
                  alignItems="center"
                  width="100%"
                  sx={{ position: "relative", height: "20px" }}
                >
                  <Divider sx={{ width: "100%", borderColor: "#ced4da" }} />
                  <Icon
                    sx={{
                      position: "absolute",
                      right: 0,
                      color: "#ced4da",
                      transform: "translateY(-50%)",
                      top: "50%",
                    }}
                  >
                    arrow_forward
                  </Icon>
                </MDBox>
              </MDBox>

              {/* Presença */}
              <MDBox display="flex" flexDirection="column" alignItems="center" flex={1}>
                <MDBox
                  variant="gradient"
                  bgColor="warning"
                  color="white"
                  coloredShadow="warning"
                  borderRadius="xl"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="4rem"
                  height="4rem"
                  mb={2}
                >
                  <Icon fontSize="medium" color="inherit">
                    check_circle
                  </Icon>
                </MDBox>
                <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
                  Presença
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold" color="warning">
                  {attendanceCount}
                </MDTypography>
              </MDBox>

              {/* Seta/Percentual entre Presença e Conversão */}
              <MDBox display="flex" flexDirection="column" alignItems="center" mx={1} flex={0.5}>
                <MDTypography
                  variant="button"
                  fontWeight="regular"
                  color="text"
                  sx={{ fontSize: "0.75rem" }}
                >
                  —
                </MDTypography>
                <MDBox
                  display="flex"
                  alignItems="center"
                  width="100%"
                  sx={{ position: "relative", height: "20px" }}
                >
                  <Divider sx={{ width: "100%", borderColor: "#ced4da" }} />
                  <Icon
                    sx={{
                      position: "absolute",
                      right: 0,
                      color: "#ced4da",
                      transform: "translateY(-50%)",
                      top: "50%",
                    }}
                  >
                    arrow_forward
                  </Icon>
                </MDBox>
              </MDBox>

              {/* Conversão */}
              <MDBox display="flex" flexDirection="column" alignItems="center" flex={1}>
                <MDBox
                  variant="gradient"
                  bgColor="success"
                  color="white"
                  coloredShadow="success"
                  borderRadius="xl"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="4rem"
                  height="4rem"
                  mb={2}
                >
                  <Icon fontSize="medium" color="inherit">
                    emoji_events
                  </Icon>
                </MDBox>
                <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
                  Conversão
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold" color="success">
                  {soldCount}
                </MDTypography>
              </MDBox>
            </MDBox>

            <Divider />

            <MDBox p={2} px={4}>
              <Grid container spacing={3} justifyContent="space-between">
                {/* Taxa de Conversão Global */}
                <Grid item xs={12} md={4}>
                  <MDBox
                    display="flex"
                    flexDirection="column"
                    alignItems={{ xs: "center", md: "flex-start" }}
                  >
                    <MDTypography
                      variant="button"
                      color="text"
                      fontWeight="regular"
                      textTransform="capitalize"
                    >
                      Conversão Global (Contato → Venda)
                    </MDTypography>
                    <MDBox display="flex" alignItems="center" mt={0.5}>
                      <MDTypography variant="h5" fontWeight="bold" color="dark">
                        —
                      </MDTypography>
                    </MDBox>
                    <MDTypography variant="caption" color="text">
                      {periodLabel}
                    </MDTypography>
                  </MDBox>
                </Grid>

                {/* Contratos Vendidos */}
                <Grid item xs={12} md={4}>
                  <MDBox display="flex" flexDirection="column" alignItems="center">
                    <MDTypography
                      variant="button"
                      color="text"
                      fontWeight="regular"
                      textTransform="capitalize"
                    >
                      Contratos Vendidos
                    </MDTypography>
                    <MDBox display="flex" alignItems="center" mt={0.5}>
                      <MDTypography variant="h5" fontWeight="bold" color="dark">
                        {soldCount}
                      </MDTypography>
                    </MDBox>
                    <MDTypography variant="caption" color="text">
                      {periodLabel}
                    </MDTypography>
                  </MDBox>
                </Grid>

                {/* Valor Total */}
                <Grid item xs={12} md={4}>
                  <MDBox
                    display="flex"
                    flexDirection="column"
                    alignItems={{ xs: "center", md: "flex-end" }}
                  >
                    <MDTypography
                      variant="button"
                      color="text"
                      fontWeight="regular"
                      textTransform="capitalize"
                    >
                      Valor Total
                    </MDTypography>
                    <MDBox display="flex" alignItems="center" mt={0.5}>
                      <MDTypography variant="h5" fontWeight="bold" color="dark">
                        {(soldNet / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </MDTypography>
                    </MDBox>
                    <MDTypography variant="caption" color="text">
                      {periodLabel}
                    </MDTypography>
                  </MDBox>
                </Grid>
              </Grid>
            </MDBox>
          </Card>
        </MDBox>

        <MDBox mb={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={12}>
              <KanbanBoard />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default Commercial;
