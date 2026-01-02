import Grid from "@mui/material/Grid";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDAlert from "components/MDAlert";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import DueDateDialog from "../purchase/components/DueDateDialog";
import SettleDebtPaymentCard from "./components/SettleDebtPaymentCard";
import SettleDebtSummaryCard from "./components/SettleDebtSummaryCard";

import { useSettleDebtPage } from "./hooks/useSettleDebtPage";

function SettleDebtPage(): JSX.Element {
  const {
    clientName,
    loading,
    error,
    totals,
    payments,
    dueDate,
    acquirers,
    submitting,
    canFinalize,
    cashierClosed,
    showDebtMismatch,
    handleFinalize,
    handleBack,
  } = useSettleDebtPage();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <MDBox mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <MDBox>
            <MDTypography variant="h4" fontWeight="bold">
              Quitar saldo
            </MDTypography>
            <MDTypography variant="button" color="text">
              {clientName}
            </MDTypography>
          </MDBox>
          <MDButton variant="outlined" color="dark" onClick={handleBack}>
            Voltar
          </MDButton>
        </MDBox>

        {showDebtMismatch && (
          <MDBox mb={3}>
            <MDAlert color="warning">
              Existe saldo em aberto no perfil do cliente, mas nenhum recebível pendente foi
              encontrado. Verifique se os recebíveis foram gerados corretamente.
            </MDAlert>
          </MDBox>
        )}

        {cashierClosed && (
          <MDBox mb={3}>
            <MDAlert color="warning">
              Caixa fechado. Abra o caixa em Financeiro &gt; Caixa para registrar pagamentos.
            </MDAlert>
          </MDBox>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <SettleDebtPaymentCard
              loading={loading}
              error={error}
              paymentSectionProps={{
                paymentTabValue: payments.paymentTabValue,
                onPaymentTabChange: payments.onPaymentTabChange,
                newPaymentMethod: payments.newPaymentMethod,
                newPaymentAmount: payments.newPaymentAmount,
                onPaymentAmountChange: payments.onPaymentAmountChange,
                newPaymentPixTxid: payments.newPaymentPixTxid,
                onPaymentPixTxidChange: payments.onPaymentPixTxidChange,
                newPaymentTransferBankName: payments.newPaymentTransferBankName,
                onPaymentTransferBankNameChange: payments.onPaymentTransferBankNameChange,
                newPaymentTransferReference: payments.newPaymentTransferReference,
                onPaymentTransferReferenceChange: payments.onPaymentTransferReferenceChange,
                newPaymentCardAcquirer: payments.newPaymentCardAcquirer,
                onPaymentCardAcquirerChange: payments.onPaymentCardAcquirerChange,
                newPaymentCardBrand: payments.newPaymentCardBrand,
                onPaymentCardBrandChange: payments.onPaymentCardBrandChange,
                newPaymentCardInstallments: payments.newPaymentCardInstallments,
                onPaymentCardInstallmentsChange: payments.onPaymentCardInstallmentsChange,
                newPaymentCardAuthCode: payments.newPaymentCardAuthCode,
                onPaymentCardAuthCodeChange: payments.onPaymentCardAuthCodeChange,
                acquirers: acquirers.data,
                acquirersLoading: Boolean(acquirers.loading),
                acquirersError: acquirers.error,
                remainingCents: totals.remainingCents,
                maxPaymentCents: payments.maxPaymentCents,
                onAddPayment: payments.onAddPayment,
                editingPaymentId: payments.editingPaymentId,
                onCancelEditPayment: payments.onCancelEditPayment,
                disabled: cashierClosed,
              }}
            />
          </Grid>

          <Grid item xs={12} lg={4}>
            <SettleDebtSummaryCard
              summaryProps={{
                grossTotalCents: totals.grossTotalCents,
                discountValue: totals.discountValue,
                netTotalCents: totals.netTotalCents,
                paidTotalCents: totals.paidTotalCents,
                remainingCents: totals.remainingCents,
                payments: payments.list,
                onEditPayment: payments.onEditPayment,
                onRemovePayment: payments.onRemovePayment,
                dueDateValue: dueDate.value,
                onOpenDueDateModal: dueDate.onOpen,
                submitting,
                canFinalize: canFinalize && !cashierClosed,
                hasItems: true,
                requireContractSelection: false,
                finalizeLabel: "Quitar saldo",
                onFinalize: handleFinalize,
              }}
            />
          </Grid>
        </Grid>

        <DueDateDialog
          open={dueDate.open}
          submitting={submitting}
          dueDateValue={dueDate.value}
          onChangeDate={dueDate.onChange}
          onClose={dueDate.onClose}
          onSave={dueDate.onClose}
        />
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SettleDebtPage;
