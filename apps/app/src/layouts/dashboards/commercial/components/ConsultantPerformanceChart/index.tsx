/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================
*/

import { useMemo } from "react";

// react-chartjs-2 components
import { Line } from "react-chartjs-2";

// @mui material components
import Card from "@mui/material/Card";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Configs
import configs from "examples/Charts/LineCharts/DefaultLineChart/configs";

// Types
interface Dataset {
  label: string;
  color: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "light" | "dark";
  data: number[];
}

interface Props {
  title: string;
  description?: string;
  height?: string | number;
  chart: {
    labels: string[];
    datasets: Dataset[];
  };
}

function ConsultantPerformanceChart({
  title,
  description,
  height = "20rem",
  chart,
}: Props): JSX.Element {
  const chartDatasets = chart.datasets.map((dataset) => ({
    ...dataset,
    tension: 0.45,
    cubicInterpolationMode: "monotone",
    pointRadius: 0,
    pointHoverRadius: 4,
    borderWidth: 3,
    maxBarThickness: 6,
  }));

  const { data, options } = configs(chart.labels, chartDatasets);

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox p={3}>
        <MDTypography variant="h6">{title}</MDTypography>
        {description && (
          <MDTypography variant="button" color="text" fontWeight="light">
            {description}
          </MDTypography>
        )}
      </MDBox>
      {useMemo(
        () => (
          <MDBox px={3} pb={3} sx={{ height }}>
            <Line data={data} options={options} />
          </MDBox>
        ),
        [chart]
      )}
    </Card>
  );
}

export default ConsultantPerformanceChart;
