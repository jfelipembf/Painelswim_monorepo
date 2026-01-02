import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import ContractForm from "./components/ContractForm";
import ContractsTable from "./components/ContractsTable";
import { useContractsPage } from "./hooks/useContractsPage";

import { ConfirmDialog } from "components";

function ContractsPage() {
  const {
    contracts,
    contractsLoading,
    contractsError,
    availableBranches,
    selectedContractId,
    formValues,
    isSaving,
    handleSelectContract,
    handleNewContract,
    handleDeleteContract,
    handleFieldValueChange,
    handleSubmit,
    confirmDialog,
    idBranch,
  } = useContractsPage();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <MDBox mb={3} display="flex" justifyContent="flex-end">
          <MDButton variant="gradient" color="info" onClick={handleNewContract} disabled={isSaving}>
            Novo contrato
          </MDButton>
        </MDBox>

        {contractsError ? (
          <MDTypography variant="caption" color="error" sx={{ display: "block", mb: 2 }}>
            {contractsError}
          </MDTypography>
        ) : null}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ overflow: "visible" }}>
              <MDBox pb={2} px={2} pt={2}>
                {contractsLoading || isSaving ? (
                  <MDBox display="flex" justifyContent="center" py={6}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : contractsError ? (
                  <MDBox py={2}>
                    <MDTypography variant="button" color="error" fontWeight="medium">
                      {contractsError}
                    </MDTypography>
                  </MDBox>
                ) : (
                  <ContractsTable
                    contracts={contracts}
                    isSaving={isSaving}
                    onEdit={handleSelectContract}
                    onDelete={handleDeleteContract}
                  />
                )}
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <ContractForm
              values={formValues}
              setFieldValue={handleFieldValueChange}
              isEditMode={!!selectedContractId}
              existingLoading={contractsLoading}
              availableBranches={availableBranches}
              currentBranchId={idBranch}
              isSaving={isSaving}
              showSavingSpinner={isSaving}
              onSubmitRequested={handleSubmit}
            />
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      <ConfirmDialog
        open={confirmDialog.dialogProps.open}
        title={confirmDialog.dialogProps.title}
        description={confirmDialog.dialogProps.description}
        confirmLabel={confirmDialog.dialogProps.confirmLabel}
        cancelLabel={confirmDialog.dialogProps.cancelLabel}
        confirmColor={confirmDialog.dialogProps.confirmColor}
        onCancel={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
      />
    </DashboardLayout>
  );
}

export default ContractsPage;
