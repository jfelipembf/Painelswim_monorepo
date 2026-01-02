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
import LinearProgress from "@mui/material/LinearProgress";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

function Progress(): JSX.Element {
  return (
    <Card
      id="progress"
      sx={{ display: "flex", flexDirection: "column", height: 420, overflow: "hidden" }}
    >
      <MDBox p={3}>
        <MDTypography variant="h5">Progresso</MDTypography>
      </MDBox>
      <MDBox p={3} pt={0} sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <MDBox border="1px solid" borderColor="grey.300" borderRadius="lg" p={2} mb={3}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h6" fontWeight="medium">
                  Nível Atual: Tubarão
                </MDTypography>
                <MDBadge badgeContent="75%" color="info" container size="xs" />
              </MDBox>
              <MDBox mb={1}>
                <MDTypography variant="button" color="text">
                  Progresso do Nível
                </MDTypography>
              </MDBox>
              <LinearProgress variant="determinate" value={75} color="info" />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6}>
            <MDBox border="1px solid" borderColor="grey.300" borderRadius="lg" p={2} mb={3}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h6" fontWeight="medium">
                  Frequência
                </MDTypography>
                <MDTypography variant="caption" color="text">
                  Últimos 30 dias
                </MDTypography>
              </MDBox>
              <MDBox display="flex" alignItems="center" gap={1}>
                <Icon color="success" fontSize="large">
                  check_circle
                </Icon>
                <MDBox>
                  <MDTypography variant="h4" fontWeight="bold">
                    92%
                  </MDTypography>
                  <MDTypography variant="button" color="text">
                    Presença confirmada
                  </MDTypography>
                </MDBox>
              </MDBox>
            </MDBox>
          </Grid>
        </Grid>

        <MDBox mt={2}>
          <MDTypography variant="h6" fontWeight="medium" mb={2}>
            Habilidades Conquistadas
          </MDTypography>
          <Grid container spacing={2}>
            {["Respiração Lateral", "Nado Crawl", "Mergulho", "Flutuação"].map((skill) => (
              <Grid item key={skill}>
                <MDBadge badgeContent={skill} color="success" variant="gradient" size="lg" />
              </Grid>
            ))}
            {["Nado Costas", "Borboleta"].map((skill) => (
              <Grid item key={skill}>
                <MDBadge badgeContent={skill} color="secondary" variant="gradient" size="lg" />
              </Grid>
            ))}
          </Grid>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default Progress;
