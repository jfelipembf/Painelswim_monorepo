import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import TestList from "layouts/pages/management/tests/components/TestList";
import TestForm from "layouts/pages/management/tests/components/TestForm";

import { useToast } from "context/ToastContext";
import { useTests, type TestDefinitionPayload } from "hooks/tests";
import type { TestFormValues, TestItem, TestTabMode } from "./types";

function TestsPage(): JSX.Element {
  const { showSuccess, showError } = useToast();
  const { tests, loading, error, createTest, updateTest, removeTest } = useTests();

  const [tab, setTab] = useState<TestTabMode>("distance");
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFormSubmit = async (values: TestFormValues) => {
    if (!String(values.name || "").trim()) {
      setFormError("Informe o nome do teste.");
      return;
    }

    const parseNumber = (raw: string): number | undefined => {
      if (!raw && raw !== "0") return undefined;
      const parsed = Number(raw);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const payload: TestDefinitionPayload = {
      mode: tab,
      name: values.name,
      fixedDistanceMeters: tab === "distance" ? parseNumber(values.fixedDistanceMeters) : undefined,
      fixedTimeSeconds: tab === "time" ? parseNumber(values.fixedTimeSeconds) : undefined,
      inactive: Boolean(values.inactive),
    };

    try {
      setFormError(null);
      setFormSaving(true);
      if (selectedTest?.id) {
        await updateTest(selectedTest.id, payload);
        showSuccess("Teste atualizado com sucesso.");
      } else {
        await createTest(payload);
        showSuccess("Teste criado com sucesso.");
      }
      setSelectedTest(null);
    } catch (err: any) {
      const message = err?.message || "Erro ao salvar teste.";
      setFormError(message);
      showError(message);
    } finally {
      setFormSaving(false);
    }
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) return;
    setDeleteDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!selectedTest?.id) return;
    setDeleteLoading(true);
    try {
      await removeTest(selectedTest.id);
      showSuccess("Teste excluído com sucesso.");
      setSelectedTest(null);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      showError(err?.message || "Erro ao excluir teste.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <TestList
              tests={tests}
              loading={loading}
              error={error}
              tab={tab}
              onTabChange={(nextTab) => {
                setSelectedTest(null);
                setTab(nextTab);
              }}
              onEdit={(test) => {
                setSelectedTest(test);
              }}
              onDelete={(test) => {
                setSelectedTest(test);
                setDeleteDialogOpen(true);
              }}
            />
          </Grid>

          <Grid item xs={12} lg={8}>
            <TestForm
              saving={formSaving}
              error={formError}
              mode={tab}
              initialData={selectedTest}
              onSubmit={handleFormSubmit}
              onReset={() => setSelectedTest(null)}
            />
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Excluir teste</DialogTitle>
        <DialogContent>
          <MDBox pt={1}>
            <MDTypography variant="body2" color="text">
              Tem certeza que deseja excluir o teste{" "}
              {selectedTest?.name ? `"${selectedTest.name}"` : ""}?
            </MDTypography>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton
            variant="outlined"
            color="secondary"
            onClick={closeDeleteDialog}
            disabled={deleteLoading}
          >
            Cancelar
          </MDButton>
          <MDButton
            variant="gradient"
            color="error"
            onClick={confirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? "Excluindo..." : "Excluir"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default TestsPage;
