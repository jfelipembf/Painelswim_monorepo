import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import type { Theme } from "@mui/material/styles";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

import { buildWaveBackground } from "layouts/pages/touch/utils";

export type QuickStatCard = {
  label: string;
  value: number;
  color: "info" | "error" | "warning" | "success";
  actionLabel: string;
};

type Props = {
  items: QuickStatCard[];
};

function QuickStatsGrid({ items }: Props): JSX.Element {
  return (
    <Grid container spacing={2}>
      {items.map((stat) => (
        <Grid item xs={12} sm={6} md={4} key={stat.label}>
          <Card
            sx={(theme: Theme) => ({
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
            })}
          >
            <MDBox p={2.5}>
              <MDTypography
                variant="h3"
                fontWeight="bold"
                lineHeight={1}
                sx={(theme: Theme) => ({ color: theme.palette.grey[700] })}
              >
                {stat.value}
              </MDTypography>
              <MDTypography
                variant="button"
                fontWeight="medium"
                sx={(theme: Theme) => ({ color: theme.palette.grey[600] })}
              >
                {stat.label}
              </MDTypography>
              <MDBox mt={1}>
                <MDButton
                  variant="text"
                  color="dark"
                  size="small"
                  endIcon={<Icon>open_in_new</Icon>}
                  sx={(theme: Theme) => ({
                    color: theme.palette.grey[600],
                    "& .material-icons": { color: theme.palette.grey[600] },
                  })}
                >
                  {stat.actionLabel}
                </MDButton>
              </MDBox>
            </MDBox>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default QuickStatsGrid;
