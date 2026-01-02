import type { ComponentProps } from "react";

import Card from "@mui/material/Card";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import PaymentSection from "layouts/pages/sales/purchase/components/PaymentSection";

type PaymentSectionProps = ComponentProps<typeof PaymentSection>;

type Props = {
  loading: boolean;
  error?: string | null;
  paymentSectionProps: PaymentSectionProps;
};

function SettleDebtPaymentCard({ loading, error, paymentSectionProps }: Props): JSX.Element {
  return (
    <Card>
      <MDBox p={3}>
        <MDTypography variant="h5">Pagamento</MDTypography>
      </MDBox>
      <MDBox pb={3} px={3}>
        {loading ? (
          <MDTypography variant="button" color="text" sx={{ mb: 2, display: "block" }}>
            Carregando...
          </MDTypography>
        ) : null}
        {error ? (
          <MDTypography variant="caption" color="error" sx={{ mb: 2, display: "block" }}>
            {error}
          </MDTypography>
        ) : null}
        <PaymentSection {...paymentSectionProps} />
      </MDBox>
    </Card>
  );
}

export default SettleDebtPaymentCard;
