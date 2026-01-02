import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

type Props = {
  inactiveAfterRenewalDays: number;
  abandonmentRiskEnabled: boolean;
  abandonmentRiskDays: number;
  onInactiveAfterRenewalDaysChange: (event: any) => void;
  onAbandonmentRiskDaysChange: (event: any) => void;
  onToggleAbandonmentRiskEnabled: () => void;
};

function SettingsSalesTab({
  inactiveAfterRenewalDays,
  abandonmentRiskEnabled,
  abandonmentRiskDays,
  onInactiveAfterRenewalDaysChange,
  onAbandonmentRiskDaysChange,
  onToggleAbandonmentRiskEnabled,
}: Props): JSX.Element {
  return (
    <MDBox display="flex" flexDirection="column" gap={3}>
      <Card>
        <MDBox p={2} display="flex" alignItems="center" gap={1}>
          <Icon color="action">shopping_cart</Icon>
          <MDTypography variant="h6">Regras de contratos</MDTypography>
        </MDBox>
        <MDBox px={2} pb={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Considerar inativo após quantos dias sem renovação após o vencimento?"
                value={inactiveAfterRenewalDays}
                onChange={onInactiveAfterRenewalDaysChange}
                inputProps={{ type: "number", min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Dias sem presença para risco de abandono"
                value={abandonmentRiskDays}
                onChange={onAbandonmentRiskDaysChange}
                inputProps={{ type: "number", min: 0 }}
                disabled={!abandonmentRiskEnabled}
              />
            </Grid>
          </Grid>
          <MDBox mt={2} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
            <MDBox>
              <MDTypography variant="button" fontWeight="medium">
                Considerar risco de abandono
              </MDTypography>
              <MDTypography variant="caption" color="text" sx={{ display: "block", mt: 0.5 }}>
                Habilita alertas quando o aluno fica sem presença.
              </MDTypography>
            </MDBox>
            <Switch checked={abandonmentRiskEnabled} onChange={onToggleAbandonmentRiskEnabled} />
          </MDBox>
        </MDBox>
      </Card>
    </MDBox>
  );
}

export default SettingsSalesTab;
