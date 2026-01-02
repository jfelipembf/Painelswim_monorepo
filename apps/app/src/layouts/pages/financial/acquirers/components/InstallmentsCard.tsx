import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import Checkbox from "@mui/material/Checkbox";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { FormField } from "components";
import type { InstallmentFee } from "hooks/acquirers";

type InstallmentsCardProps = {
  installmentFees: InstallmentFee[];
  anticipateReceivables: boolean;
  onToggleAnticipate: () => void;
  onToggleInstallment: (installment: number) => void;
  onChangeInstallmentFee: (installment: number, value: number) => void;
  onAddInstallment: () => void;
};

function InstallmentsCard({
  installmentFees,
  anticipateReceivables,
  onToggleAnticipate,
  onToggleInstallment,
  onChangeInstallmentFee,
  onAddInstallment,
}: InstallmentsCardProps): JSX.Element {
  return (
    <Card sx={{ overflow: "visible" }}>
      <MDBox p={2} pb={1} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
        <MDTypography variant="h6">Parcelas</MDTypography>
        <MDButton variant="outlined" color="info" size="small" onClick={onAddInstallment}>
          <Icon fontSize="small">add</Icon>&nbsp;Adicionar parcela
        </MDButton>
      </MDBox>

      <MDBox px={2} pb={2}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDTypography variant="button" fontWeight="medium">
            Antecipar recebíveis?
          </MDTypography>
          <Switch checked={anticipateReceivables} onChange={onToggleAnticipate} />
        </MDBox>

        <Grid container spacing={1.5}>
          {installmentFees.map((row) => (
            <Grid item xs={12} key={row.installment}>
              <MDBox
                display="grid"
                gridTemplateColumns={{ xs: "1fr", sm: "220px 1fr" }}
                alignItems="center"
                gap={2}
                px={2}
                py={1.5}
                borderRadius="lg"
                sx={{ border: "1px solid rgba(0,0,0,0.08)", backgroundColor: "white" }}
              >
                <MDBox display="flex" alignItems="center" gap={1}>
                  <Checkbox
                    checked={row.active}
                    onChange={() => onToggleInstallment(row.installment)}
                  />
                  <MDTypography variant="button" fontWeight="medium">
                    {`${row.installment}x`}
                  </MDTypography>
                </MDBox>

                <FormField
                  label="Taxa (%)"
                  value={row.feePercent}
                  onChange={(e: any) => {
                    const v = Number(e?.target?.value ?? 0);
                    onChangeInstallmentFee(row.installment, Number.isFinite(v) ? v : 0);
                  }}
                  inputProps={{ type: "number", step: 0.01 }}
                  disabled={!row.active}
                />
              </MDBox>
            </Grid>
          ))}
        </Grid>
      </MDBox>
    </Card>
  );
}

export default InstallmentsCard;
