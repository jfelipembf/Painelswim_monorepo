import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

type Props = {
  autoCloseCashierAtMidnight: boolean;
  cancelContractsAfterDaysWithoutPayment: number;
  onToggleAutoCloseCashier: () => void;
  onCancelContractsAfterDaysWithoutPaymentChange: (event: any) => void;
};

function SettingsFinancialTab({
  autoCloseCashierAtMidnight,
  cancelContractsAfterDaysWithoutPayment,
  onToggleAutoCloseCashier,
  onCancelContractsAfterDaysWithoutPaymentChange,
}: Props): JSX.Element {
  return (
    <MDBox display="flex" flexDirection="column" gap={3}>
      <Card>
        <MDBox p={2} display="flex" alignItems="center" gap={1}>
          <Icon color="action">account_balance_wallet</Icon>
          <MDTypography variant="h6">Automação financeira</MDTypography>
        </MDBox>
        <MDBox px={2} pb={2}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" gap={2} mb={2}>
            <MDBox>
              <MDTypography variant="button" fontWeight="medium">
                Fechar o caixa automaticamente todos os dias às 00:00?
              </MDTypography>
              <MDTypography variant="caption" color="text" sx={{ display: "block", mt: 0.5 }}>
                Fecha o caixa e gera o resumo do dia.
              </MDTypography>
            </MDBox>
            <Switch checked={autoCloseCashierAtMidnight} onChange={onToggleAutoCloseCashier} />
          </MDBox>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Cancelar contratos após quantos dias sem pagamento?"
                value={cancelContractsAfterDaysWithoutPayment}
                onChange={onCancelContractsAfterDaysWithoutPaymentChange}
                inputProps={{ type: "number", min: 0 }}
              />
            </Grid>
          </Grid>
        </MDBox>
      </Card>
    </MDBox>
  );
}

export default SettingsFinancialTab;
