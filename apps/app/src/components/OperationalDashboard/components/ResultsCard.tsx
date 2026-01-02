import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import type { Theme } from "@mui/material/styles";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

export type ResultCard = {
  label: string;
  value: number;
  target: number;
  suffix: string;
  formatter?: (value: number) => string;
  previousValue?: number;
  subtitle: string;
  improvementPercent: number;
};

type Props = {
  items: ResultCard[];
};

function ResultsCard({ items }: Props): JSX.Element {
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox p={2} display="flex" alignItems="center" gap={1}>
        <Icon color="action">analytics</Icon>
        <MDTypography variant="h6">Resultados</MDTypography>
      </MDBox>
      <MDBox px={2} pb={2}>
        <Grid container spacing={2}>
          {items.map((card, index) => {
            const value = Number(card.value) || 0;
            const displayValue =
              typeof card.formatter === "function"
                ? card.formatter(value)
                : `${value}${card.suffix}`;

            const improvement = Number(card.improvementPercent);
            const safeImprovement = Number.isFinite(improvement) ? improvement : 0;

            const hasPreviousValue =
              typeof card.previousValue === "number" && Number.isFinite(card.previousValue);
            const previousValue = hasPreviousValue ? card.previousValue : 0;
            const displayPreviousValue =
              typeof card.formatter === "function"
                ? card.formatter(previousValue)
                : `${previousValue}${card.suffix}`;

            const isPositive = safeImprovement >= 0;
            const improvementLabel = `${isPositive ? "+" : ""}${safeImprovement}%`;

            return (
              <Grid item xs={12} sm={4} key={card.label}>
                <MDBox
                  px={2}
                  py={1.5}
                  display="flex"
                  flexDirection="column"
                  height="100%"
                  sx={(theme: Theme) => ({
                    borderLeft: index === 0 ? "none" : `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <MDBox display="flex" alignItems="flex-start" justifyContent="space-between">
                    <MDBox>
                      <MDTypography variant="button" fontWeight="medium" sx={{ opacity: 0.8 }}>
                        {card.label}
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
                  </MDBox>

                  <MDBox mt="auto" display="flex" justifyContent="flex-end">
                    <MDBox textAlign="right">
                      <MDTypography
                        variant="caption"
                        sx={(theme: Theme) => ({ color: theme.palette.grey[600] })}
                      >
                        {card.subtitle}
                      </MDTypography>
                      <MDTypography
                        variant="h4"
                        fontWeight="bold"
                        sx={(theme: Theme) => ({ color: theme.palette.grey[800] })}
                      >
                        {displayValue}
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </MDBox>
              </Grid>
            );
          })}
        </Grid>
      </MDBox>
    </Card>
  );
}

export default ResultsCard;
