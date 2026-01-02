import { useState } from "react";

import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import EvaluationLevelForm from "layouts/pages/management/evaluation-levels/components/EvaluationLevelForm";
import EvaluationLevelList from "layouts/pages/management/evaluation-levels/components/EvaluationLevelList";

import { useToast } from "context/ToastContext";
import { useEvaluationLevels, type EvaluationLevelPayload } from "hooks/evaluationLevels";
import { useAppSelector } from "../../../../redux/hooks";
import type { EvaluationLevelFormValues, EvaluationLevelItem } from "./types";

function EvaluationLevelsPage(): JSX.Element {
  const { showSuccess, showError } = useToast();
  const { idBranch } = useAppSelector((state) => state.branch);
  const { sortedLevels, loading, error, createLevel, updateLevel, removeLevel, reorderLevels } =
    useEvaluationLevels();

  const [selectedLevel, setSelectedLevel] = useState<EvaluationLevelItem | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const closeDeleteDialog = () => {
    if (deleteLoading) return;
    setDeleteDialogOpen(false);
  };

  const sharedLevels = sortedLevels.filter((lvl) => !lvl.idBranch);
  const branchLevels = sortedLevels.filter((lvl) => Boolean(lvl.idBranch));

  const confirmDelete = async () => {
    if (!selectedLevel?.id) return;

    setDeleteLoading(true);
    try {
      await removeLevel(selectedLevel.id);
      showSuccess("Nível excluído com sucesso.");
      setSelectedLevel(null);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      showError(err?.message || "Erro ao excluir nível.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSubmit = async (values: EvaluationLevelFormValues) => {
    const canAssignToBranch = Boolean(String(idBranch || "").trim());

    const parsedValue = Number(values.value);
    if (!values.name.trim()) {
      setFormError("Informe o nome do nível.");
      return;
    }
    if (Number.isNaN(parsedValue)) {
      setFormError("Informe um valor numérico válido.");
      return;
    }

    if (!canAssignToBranch) {
      setFormError("Selecione uma unidade ativa.");
      return;
    }

    const payload: EvaluationLevelPayload = {
      name: values.name,
      value: parsedValue,
      inactive: Boolean(values.inactive),
    };

    try {
      setFormError(null);
      setFormSaving(true);

      if (selectedLevel?.id) {
        await updateLevel(selectedLevel.id, {
          ...payload,
        });
        showSuccess("Nível atualizado com sucesso.");
      } else {
        await createLevel(payload);
        showSuccess("Nível criado com sucesso.");
      }

      setSelectedLevel(null);
    } catch (err: any) {
      const message = err?.message || "Erro ao salvar nível.";
      setFormError(message);
      showError(message);
    } finally {
      setFormSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <MDBox py={3} px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <EvaluationLevelList
              loading={loading}
              error={error}
              sharedLevels={sharedLevels}
              branchLevels={branchLevels}
              onEdit={(level) => {
                setSelectedLevel(level);
                setFormError(null);
              }}
              onDelete={(level) => {
                setSelectedLevel(level);
                setDeleteDialogOpen(true);
              }}
              onReorder={reorderLevels}
              onReorderSuccess={showSuccess}
              onReorderError={showError}
            />
          </Grid>

          <Grid item xs={12} lg={8}>
            <EvaluationLevelForm
              saving={formSaving}
              error={formError}
              initialData={selectedLevel}
              canAssignToBranch={Boolean(String(idBranch || "").trim())}
              onSubmit={handleFormSubmit}
              onReset={() => setSelectedLevel(null)}
            />
          </Grid>
        </Grid>
      </MDBox>

      <Footer />

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Excluir nível</DialogTitle>
        <DialogContent>
          <MDBox pt={1}>
            <MDTypography variant="body2" color="text">
              Tem certeza que deseja excluir o nível{" "}
              {selectedLevel?.name ? `"${selectedLevel.name}"` : ""}?
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

export default EvaluationLevelsPage;
