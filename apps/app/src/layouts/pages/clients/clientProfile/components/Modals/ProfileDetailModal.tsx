import { ReactNode } from "react";

import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";

import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    color: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "light" | "dark";
    data: number[];
  }[];
};

type MonthOption = {
  value: string;
  label: string;
};

export type { ChartData, MonthOption };

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerControls?: ReactNode;
  month: string;
  months: MonthOption[];
  onMonthChange: (value: string) => void;
  chart: ChartData;
  children?: ReactNode;
};

function ProfileDetailModal({
  open,
  onClose,
  title,
  subtitle,
  headerControls,
  month,
  months,
  onMonthChange,
  chart,
  children,
}: Props): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogContent>
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
        >
          <MDBox>
            <MDTypography variant="h5">{title}</MDTypography>
            {subtitle ? (
              <MDTypography variant="button" color="text" fontWeight="regular">
                {subtitle}
              </MDTypography>
            ) : null}
          </MDBox>

          <MDBox display="flex" alignItems="center" gap={2}>
            {headerControls ? headerControls : null}
            <FormField
              label="Mês"
              select
              value={month}
              onChange={(e: any) => onMonthChange(e?.target?.value)}
            >
              {months.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </FormField>

            <MDButton variant="outlined" color="secondary" onClick={onClose}>
              Fechar
            </MDButton>
          </MDBox>
        </MDBox>

        <MDBox mt={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ overflow: "visible" }}>
                <DefaultLineChart title="" description="" height={280} chart={chart} />
              </Card>
            </Grid>

            {children ? (
              <Grid item xs={12}>
                <Card sx={{ overflow: "visible" }}>
                  <MDBox p={3}>{children}</MDBox>
                </Card>
              </Grid>
            ) : null}
          </Grid>
        </MDBox>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileDetailModal;
