import { useState } from "react";

import Grid from "@mui/material/Grid";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import AreaForm from "layouts/pages/admin/areas/components/AreaForm";
import AreaList from "layouts/pages/admin/areas/components/AreaList";

import { useToast } from "context/ToastContext";

import { useConfirmDialog } from "hooks/useConfirmDialog";

import { useAreas } from "hooks/areas";
import { ConfirmDialog } from "components";
import type { AreaItem } from "./types";

function AreasPage(): JSX.Element {
  const [selectedArea, setSelectedArea] = useState<AreaItem | null>(null);

  const toast = useToast();
  const confirmDialog = useConfirmDialog();

  const { areas, loading, error, create, update, remove } = useAreas();

  const handleDeleteArea = (area: AreaItem) => {
    void (async () => {
      const ok = await confirmDialog.confirm({
        title: "Excluir área?",
        description: "Esta ação não pode ser desfeita.",
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmColor: "error",
      });
      if (!ok) return;
      try {
        await remove(area.id);
        if (selectedArea?.id === area.id) {
          setSelectedArea(null);
        }
        toast.showSuccess("Área excluída.");
      } catch (e: any) {
        toast.showError(e?.message || "Erro ao excluir área.");
      }
    })();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <AreaList
              areas={areas}
              loading={loading}
              error={error}
              onEdit={(area) => setSelectedArea(area)}
              onDelete={handleDeleteArea}
            />
          </Grid>

          <Grid item xs={12} lg={8}>
            <AreaForm
              saving={false}
              error={null}
              initialData={selectedArea}
              onCancel={() => setSelectedArea(null)}
              onSubmit={async (values) => {
                try {
                  if (selectedArea?.id) {
                    await update(selectedArea.id, values);
                    toast.showSuccess("Área salva.");
                  } else {
                    await create(values);
                    toast.showSuccess("Área criada.");
                  }
                  setSelectedArea(null);
                } catch (e: any) {
                  toast.showError(e?.message || "Erro ao salvar área.");
                }
              }}
            />
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      <ConfirmDialog
        {...confirmDialog.dialogProps}
        onCancel={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
      />
    </DashboardLayout>
  );
}

export default AreasPage;
