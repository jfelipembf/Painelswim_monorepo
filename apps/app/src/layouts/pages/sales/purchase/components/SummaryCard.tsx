import Card from "@mui/material/Card";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { formatCentsBRL } from "hooks/sales";
import type { PurchasePaymentDraft } from "../types";

type Props = {
  grossTotalCents: number;
  discountValue: number;
  netTotalCents: number;
  paidTotalCents: number;
  remainingCents: number;
  payments: PurchasePaymentDraft[];
  onEditPayment: (payment: PurchasePaymentDraft) => void;
  onRemovePayment: (paymentId: string) => void;
  dueDateValue: Date | null;
  onOpenDueDateModal: () => void;
  submitting: boolean;
  canFinalize: boolean;
  hasItems: boolean;
  requireContractSelection: boolean;
  finalizeLabel?: string;
  onFinalize: () => void;
};

const SummaryCard = ({
  grossTotalCents,
  discountValue,
  netTotalCents,
  paidTotalCents,
  remainingCents,
  payments,
  onEditPayment,
  onRemovePayment,
  dueDateValue,
  onOpenDueDateModal,
  submitting,
  canFinalize,
  hasItems,
  requireContractSelection,
  finalizeLabel,
  onFinalize,
}: Props): JSX.Element => (
  <Card>
    <MDBox p={3}>
      <MDTypography variant="h6">Resumo</MDTypography>

      <MDBox mt={2} display="flex" flexDirection="column" gap={1}>
        <MDBox display="flex" justifyContent="space-between" gap={2}>
          <MDTypography variant="button" color="text">
            Total bruto
          </MDTypography>
          <MDTypography variant="button" fontWeight="medium">
            {formatCentsBRL(grossTotalCents)}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" gap={2}>
          <MDTypography variant="button" color="text">
            Desconto
          </MDTypography>
          <MDTypography variant="button" fontWeight="medium">
            {formatCentsBRL(discountValue)}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" gap={2}>
          <MDTypography variant="button" color="text">
            Total líquido
          </MDTypography>
          <MDTypography variant="button" fontWeight="medium">
            {formatCentsBRL(netTotalCents)}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" gap={2}>
          <MDTypography variant="button" color="text">
            Pago
          </MDTypography>
          <MDTypography variant="button" fontWeight="medium">
            {formatCentsBRL(paidTotalCents)}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" gap={2}>
          <MDTypography variant="button" color="text">
            Saldo
          </MDTypography>
          <MDTypography
            variant="button"
            fontWeight="medium"
            color={remainingCents > 0 ? "error" : "success"}
          >
            {formatCentsBRL(remainingCents)}
          </MDTypography>
        </MDBox>
      </MDBox>

      <MDBox mt={3}>
        <MDTypography variant="button" fontWeight="regular" color="text">
          Pagamentos
        </MDTypography>
        <MDBox mt={1} display="flex" flexDirection="column" gap={1}>
          {payments.length ? (
            payments.map((payment, index) => (
              <MDBox
                key={payment.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
              >
                <MDTypography variant="caption" color="text">
                  {index + 1}. {String(payment.method || "").toUpperCase()} —{" "}
                  {formatCentsBRL(Number(payment.amountCents || 0))}
                </MDTypography>
                <MDBox display="flex" gap={1}>
                  <MDButton
                    variant="outlined"
                    color="info"
                    size="small"
                    onClick={() => onEditPayment(payment)}
                  >
                    Editar
                  </MDButton>
                  <MDButton
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={() => onRemovePayment(payment.id)}
                  >
                    Excluir
                  </MDButton>
                </MDBox>
              </MDBox>
            ))
          ) : (
            <MDTypography variant="caption" color="text">
              Nenhum pagamento adicionado.
            </MDTypography>
          )}
        </MDBox>
      </MDBox>

      <MDBox mt={3}>
        {remainingCents > 0 ? (
          <MDBox mb={2} display="flex" flexDirection="column" gap={1}>
            <MDTypography variant="caption" color="text">
              Data prometida:{" "}
              {dueDateValue ? dueDateValue.toLocaleDateString("pt-BR") : "não definida"}
            </MDTypography>
            <MDButton
              variant="outlined"
              color="info"
              size="small"
              sx={{ alignSelf: "flex-start" }}
              onClick={onOpenDueDateModal}
            >
              Informar data
            </MDButton>
          </MDBox>
        ) : null}

        <MDButton
          fullWidth
          variant="gradient"
          color="info"
          disabled={submitting || !canFinalize}
          onClick={onFinalize}
        >
          {submitting ? "Finalizando..." : finalizeLabel || "Finalizar venda"}
        </MDButton>
      </MDBox>
    </MDBox>
  </Card>
);

export default SummaryCard;
