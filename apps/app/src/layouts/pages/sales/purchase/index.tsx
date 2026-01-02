import { useNavigate, useParams } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDAlert from "components/MDAlert";
import MDTypography from "components/MDTypography";

import { useAppSelector } from "../../../../redux/hooks";
import { useToast } from "../../../../context/ToastContext";
import { useCashierStatus } from "hooks/cashier";

import ContractSection from "./components/ContractSection";
import DiscountSection from "./components/DiscountSection";
import DueDateDialog from "./components/DueDateDialog";
import PaymentSection from "./components/PaymentSection";
import ProductSection from "./components/ProductSection";
import ServiceSection from "./components/ServiceSection";
import SummaryCard from "./components/SummaryCard";
import { usePurchaseController } from "./hooks/usePurchaseController";

function ClientPurchasePage(): JSX.Element {
  const params = useParams();
  const memberId = String(params?.id || "");

  const navigate = useNavigate();

  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch, branches } = useAppSelector((state) => state.branch);
  const authUser = useAppSelector((state) => state.auth.user);

  const { showError, showSuccess } = useToast();
  const cashier = useCashierStatus();

  const purchase = usePurchaseController({
    memberId,
    idTenant,
    idBranch,
    branches,
    authUser,
    showError,
    showSuccess,
    onSaleSuccess: (saleId) =>
      navigate(`/clients/profile/${memberId}`, { replace: true, state: { saleId } }),
  });

  const {
    tab,
    tabValue,
    onTabChange,
    contract,
    branchOptions,
    products,
    services,
    checkoutItems,
    totals,
    discount,
    payments,
    dueDate,
    acquirers,
    submitting,
    canFinalize,
    hasItems,
    requireContractSelection,
    onFinalize,
  } = purchase;

  const cashierClosed = !cashier.loading && !cashier.isOpen;
  const handleFinalize = () => {
    if (cashierClosed) {
      showError("Caixa fechado. Abra o caixa para concluir a venda.");
      return;
    }
    onFinalize();
  };
  const handleAddPayment = () => {
    if (cashierClosed) {
      showError("Caixa fechado. Abra o caixa para registrar pagamentos.");
      return;
    }
    payments.onAddPayment();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <MDBox mb={2} display="flex" flexDirection="column" gap={1}>
          <MDBox sx={{ maxWidth: 460 }}>
            <Tabs
              value={tabValue}
              onChange={onTabChange}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Contratos" />
              <Tab label="Produtos" />
              <Tab label="Serviços" />
            </Tabs>
          </MDBox>
        </MDBox>

        {cashierClosed && (
          <MDBox mb={2}>
            <MDAlert color="warning">
              Caixa fechado. Abra o caixa em Financeiro &gt; Caixa para efetuar a venda.
            </MDAlert>
          </MDBox>
        )}

        <MDBox mt={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <MDBox component="form" pb={3} px={3} p={3}>
                  <MDTypography variant="h6" fontWeight="medium">
                    Formulário
                  </MDTypography>

                  {tab === "contracts" ? (
                    <ContractSection
                      contracts={contract.contracts}
                      contractsLoading={Boolean(contract.contractsLoading)}
                      contractsError={contract.contractsError}
                      contractId={contract.contractId}
                      onSelectContract={contract.onSelectContract}
                      selectedContract={contract.selectedContract}
                      allowCrossBranchAccess={contract.allowCrossBranchAccess}
                      onToggleCrossBranchAccess={contract.onToggleCrossBranchAccess}
                      branchOptions={branchOptions}
                      allowedBranchIds={contract.allowedBranchIds}
                      onAllowedBranchIdsChange={contract.onAllowedBranchIdsChange}
                      checkoutItems={checkoutItems}
                      grossTotalCents={totals.grossTotalCents}
                      netTotalCents={totals.netTotalCents}
                    />
                  ) : null}

                  {tab === "products" ? (
                    <ProductSection
                      products={products.products}
                      productSelection={products.selection}
                      onProductSelectionChange={products.onSelectionChange}
                      onAddProductSelection={products.onAddSelection}
                      productItems={products.items}
                      onUpdateProductQuantity={products.onUpdateQuantity}
                    />
                  ) : null}

                  {tab === "services" ? (
                    <ServiceSection
                      services={services.services}
                      serviceSelection={services.selection}
                      onServiceSelectionChange={services.onSelectionChange}
                      onAddServiceSelection={services.onAddSelection}
                      serviceItems={services.items}
                      onUpdateServiceQuantity={services.onUpdateQuantity}
                    />
                  ) : null}

                  <DiscountSection
                    discountValue={discount.value}
                    grossTotalCents={totals.grossTotalCents}
                    remainingCents={totals.remainingCents}
                    onDiscountChange={discount.onChange}
                  />

                  <PaymentSection
                    paymentTabValue={payments.paymentTabValue}
                    onPaymentTabChange={payments.onPaymentTabChange}
                    newPaymentMethod={payments.newPaymentMethod}
                    newPaymentAmount={payments.newPaymentAmount}
                    onPaymentAmountChange={payments.onPaymentAmountChange}
                    newPaymentPixTxid={payments.newPaymentPixTxid}
                    onPaymentPixTxidChange={payments.onPaymentPixTxidChange}
                    newPaymentTransferBankName={payments.newPaymentTransferBankName}
                    onPaymentTransferBankNameChange={payments.onPaymentTransferBankNameChange}
                    newPaymentTransferReference={payments.newPaymentTransferReference}
                    onPaymentTransferReferenceChange={payments.onPaymentTransferReferenceChange}
                    newPaymentCardAcquirer={payments.newPaymentCardAcquirer}
                    onPaymentCardAcquirerChange={payments.onPaymentCardAcquirerChange}
                    newPaymentCardBrand={payments.newPaymentCardBrand}
                    onPaymentCardBrandChange={payments.onPaymentCardBrandChange}
                    newPaymentCardInstallments={payments.newPaymentCardInstallments}
                    onPaymentCardInstallmentsChange={payments.onPaymentCardInstallmentsChange}
                    newPaymentCardAuthCode={payments.newPaymentCardAuthCode}
                    onPaymentCardAuthCodeChange={payments.onPaymentCardAuthCodeChange}
                    acquirers={acquirers.data}
                    acquirersLoading={Boolean(acquirers.loading)}
                    acquirersError={acquirers.error}
                    remainingCents={totals.remainingCents}
                    maxPaymentCents={payments.maxPaymentCents}
                    onAddPayment={handleAddPayment}
                    editingPaymentId={payments.editingPaymentId}
                    onCancelEditPayment={payments.onCancelEditPayment}
                    disabled={cashierClosed}
                  />
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <SummaryCard
                grossTotalCents={totals.grossTotalCents}
                discountValue={discount.value}
                netTotalCents={totals.netTotalCents}
                paidTotalCents={totals.paidTotalCents}
                remainingCents={totals.remainingCents}
                payments={payments.list}
                onEditPayment={payments.onEditPayment}
                onRemovePayment={payments.onRemovePayment}
                dueDateValue={dueDate.value}
                onOpenDueDateModal={dueDate.onOpen}
                submitting={submitting}
                canFinalize={canFinalize && !cashierClosed}
                hasItems={hasItems}
                requireContractSelection={requireContractSelection}
                onFinalize={handleFinalize}
              />
            </Grid>
          </Grid>
        </MDBox>

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

export default ClientPurchasePage;
