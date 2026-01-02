import Grid from "@mui/material/Grid";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { formatCentsBRL } from "hooks/sales";
import { FormField } from "components";

type Props = {
  discountValue: number;
  grossTotalCents: number;
  remainingCents: number;
  onDiscountChange: (value: string) => void;
};

const DiscountSection = ({
  discountValue,
  grossTotalCents,
  remainingCents,
  onDiscountChange,
}: Props): JSX.Element => (
  <MDBox mt={3}>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormField
          label="Desconto (R$)"
          name="discount"
          type="number"
          value={String(discountValue / 100)}
          onChange={(event: any) => onDiscountChange(event.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField
          label="Saldo"
          value={formatCentsBRL(remainingCents)}
          InputProps={{ readOnly: true }}
        />
      </Grid>
    </Grid>
    {discountValue > grossTotalCents ? (
      <MDTypography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
        Desconto não pode ser maior que o total.
      </MDTypography>
    ) : null}
  </MDBox>
);

export default DiscountSection;
