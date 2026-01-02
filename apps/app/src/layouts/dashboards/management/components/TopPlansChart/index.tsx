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
import Tooltip from "@mui/material/Tooltip";
import Icon from "@mui/material/Icon";
import Grid from "@mui/material/Grid";
import type { Theme } from "@mui/material/styles";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadgeDot from "components/MDBadgeDot";
import PieChart from "examples/Charts/PieChart";

// ✅ Data (renomeado)
import topPlansChartData from "./data";

// Material Dashboard 2 PRO React TS contexts
import { useMaterialUIController } from "context";

export type TopPlansChartData = {
  labels: string[];
  datasets: {
    label: string;
    backgroundColors: string[];
    data: number[];
  };
};

type Props = {
  chart?: TopPlansChartData;
  cardSx?: Record<string, any> | ((theme: Theme) => Record<string, any>);
  title?: string;
  description?: string;
  tooltip?: string;
  actionLabel?: string;
};

function TopPlansChart({
  chart,
  cardSx,
  title,
  description,
  tooltip,
  actionLabel,
}: Props): JSX.Element {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  const source: TopPlansChartData = chart ?? (topPlansChartData as TopPlansChartData);
  const cardTitle = title ?? "Planos mais vendidos";
  const cardDescription =
    description ?? "Distribuição de vendas por tipo de plano no período selecionado.";
  const tooltipLabel = tooltip ?? "Veja a distribuição dos planos";
  const buttonLabel = actionLabel ?? "ver detalhes";

  const legendItems = (source?.labels || []).map((label, index) => ({
    label,
    color: String(source?.datasets?.backgroundColors?.[index] || "dark"),
  }));

  const resolvedCardSx = cardSx ?? { height: "100%" };

  return (
    <Card sx={resolvedCardSx}>
      <MDBox display="flex" justifyContent="space-between" alignItems="center" pt={2} px={2}>
        <MDTypography variant="h6">{cardTitle}</MDTypography>

        <Tooltip title={tooltipLabel} placement="bottom" arrow>
          <MDButton variant="outlined" color="secondary" size="small" circular iconOnly>
            <Icon>priority_high</Icon>
          </MDButton>
        </Tooltip>
      </MDBox>

      <MDBox mt={3}>
        <Grid container alignItems="center">
          <Grid item xs={7}>
            <PieChart chart={source} height="12.5rem" />
          </Grid>

          <Grid item xs={5}>
            <MDBox pr={1}>
              {legendItems.slice(0, 6).map((item) => (
                <MDBox key={item.label} mb={1}>
                  <MDBadgeDot color={item.color as any} size="sm" badgeContent={item.label} />
                </MDBox>
              ))}
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>

      <MDBox
        pt={4}
        pb={2}
        px={2}
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        mt="auto"
      >
        <MDBox width={{ xs: "100%", sm: "60%" }} lineHeight={1}>
          <MDTypography variant="button" color="text" fontWeight="light">
            {cardDescription}
          </MDTypography>
        </MDBox>

        <MDBox width={{ xs: "100%", sm: "40%" }} textAlign="right" mt={{ xs: 2, sm: "auto" }}>
          <MDButton color={darkMode ? "white" : "light"}>{buttonLabel}</MDButton>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default TopPlansChart;
