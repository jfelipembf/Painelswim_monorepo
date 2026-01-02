import { useEffect, useMemo, useState } from "react";

import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Switch from "@mui/material/Switch";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { useToast } from "../../../../context/ToastContext";
import { createAcquirer, deleteAcquirer, updateAcquirer, useAcquirers } from "hooks/acquirers";

import { useAppSelector } from "../../../../redux/hooks";

import { FormField } from "components";
import type { CardBrandKey } from "constants/cardBrands";

import AcquirerBrands from "./components/AcquirerBrands";
import AcquirerList from "./components/AcquirerList";
import InstallmentsCard from "./components/InstallmentsCard";
import type { AcquirerFormState } from "./types";
import { buildNewAcquirer, cloneForm, toForm, toPayload } from "./utils";

function AcquirersPage(): JSX.Element {
  const { showError, showSuccess } = useToast();
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);
  const { data: acquirers, loading, error, refetch } = useAcquirers();
  const [selectedId, setSelectedId] = useState<string>("new");
  const [form, setForm] = useState<AcquirerFormState>(() => buildNewAcquirer());
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");

  const selectedAcquirer = useMemo(
    () => acquirers.find((a) => a.id === selectedId) ?? null,
    [acquirers, selectedId]
  );

  useEffect(() => {
    if (loading) return;
    if (selectedId !== "new") return;
    if (!acquirers.length) return;
    syncSelection(acquirers[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acquirers, loading]);

  const syncSelection = (id: string) => {
    setSelectedId(id);
    const found = acquirers.find((a) => a.id === id);
    setForm(found ? cloneForm(toForm(found)) : buildNewAcquirer());
  };

  const handleNew = () => {
    setSelectedId("new");
    setForm(buildNewAcquirer());
  };

  const handleClear = () => {
    if (selectedId === "new") {
      setForm(buildNewAcquirer());
      return;
    }
    if (selectedAcquirer) {
      setForm(cloneForm(toForm(selectedAcquirer)));
      return;
    }
    setForm(buildNewAcquirer());
  };

  const handleSave = () => {
    void (async () => {
      setSaving(true);
      try {
        if (!idTenant || !idBranch) {
          showError("Academia ou unidade não identificada.");
          return;
        }

        const payload = toPayload(form);
        if (!payload.name) {
          showError("Nome da adquirente é obrigatório.");
          return;
        }

        if (selectedId === "new") {
          const id = await createAcquirer(idTenant, idBranch, payload);
          await refetch();
          syncSelection(id);
          showSuccess("Adquirente criada!");
          return;
        }

        await updateAcquirer(idTenant, idBranch, selectedId, payload);
        await refetch();
        showSuccess("Adquirente atualizada!");
      } catch (e: unknown) {
        showError(e instanceof Error ? e.message : "Não foi possível salvar.");
      } finally {
        setSaving(false);
      }
    })();
  };

  const openDeleteDialog = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId("");
  };

  const confirmDelete = () => {
    if (!deleteTargetId) {
      closeDeleteDialog();
      return;
    }

    void (async () => {
      try {
        if (!idTenant || !idBranch) {
          showError("Academia ou unidade não identificada.");
          return;
        }

        await deleteAcquirer(idTenant, idBranch, deleteTargetId);
        await refetch();

        if (selectedId === deleteTargetId) {
          handleNew();
        }

        showSuccess("Adquirente excluída!");
      } catch (e: unknown) {
        showError(e instanceof Error ? e.message : "Não foi possível excluir.");
      } finally {
        closeDeleteDialog();
      }
    })();

    return;
  };

  const handleToggleBrand = (brand: CardBrandKey) => {
    setForm((prev) => ({
      ...prev,
      brands: { ...prev.brands, [brand]: !prev.brands[brand] },
    }));
  };

  const handleInstallmentToggle = (installment: number) => {
    setForm((prev) => ({
      ...prev,
      installmentFees: prev.installmentFees.map((row) =>
        row.installment === installment ? { ...row, active: !row.active } : row
      ),
    }));
  };

  const handleInstallmentFeeChange = (installment: number, value: number) => {
    setForm((prev) => ({
      ...prev,
      installmentFees: prev.installmentFees.map((row) =>
        row.installment === installment ? { ...row, feePercent: value } : row
      ),
    }));
  };

  const handleAddInstallment = () => {
    setForm((prev) => {
      const nextInstallment = (prev.installmentFees.at(-1)?.installment ?? 0) + 1;
      return {
        ...prev,
        installmentFees: [
          ...prev.installmentFees,
          {
            installment: nextInstallment,
            active: false,
            feePercent: 0,
          },
        ],
      };
    });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <AcquirerList
              acquirers={acquirers}
              selectedId={selectedId}
              error={error}
              onNew={handleNew}
              onSelect={syncSelection}
              onDelete={openDeleteDialog}
            />
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card sx={{ overflow: "visible" }}>
              <MDBox
                p={3}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={2}
              >
                <MDBox display="flex" alignItems="center" gap={1.5}>
                  <Icon fontSize="small">credit_card</Icon>
                  <MDTypography variant="h5">
                    {selectedId === "new"
                      ? "Nova adquirinte"
                      : selectedAcquirer?.name || "Adquirinte"}
                  </MDTypography>
                </MDBox>

                <MDBox display="flex" gap={2}>
                  <MDButton variant="outlined" color="info" onClick={handleClear}>
                    Limpar
                  </MDButton>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleSave}
                    disabled={saving || loading}
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </MDButton>
                </MDBox>
              </MDBox>

              <MDBox pb={3} px={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Nome"
                      value={form.name}
                      onChange={(e: any) =>
                        setForm((prev) => ({ ...prev, name: e?.target?.value ?? "" }))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <MDBox
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                    >
                      <MDTypography
                        variant="button"
                        fontWeight="medium"
                        color={form.inactive ? "secondary" : "success"}
                      >
                        {form.inactive ? "Inativo" : "Ativo"}
                      </MDTypography>
                      <Switch
                        checked={!form.inactive}
                        onChange={() => setForm((prev) => ({ ...prev, inactive: !prev.inactive }))}
                      />
                    </MDBox>
                  </Grid>

                  <Grid item xs={12}>
                    <MDTypography
                      variant="button"
                      fontWeight="medium"
                      sx={{ mb: 1, display: "block" }}
                    >
                      Bandeiras
                    </MDTypography>
                    <AcquirerBrands
                      brands={form.brands}
                      otherBrandName={form.otherBrandName}
                      onToggle={handleToggleBrand}
                      onChangeOtherBrandName={(value) =>
                        setForm((prev) => ({ ...prev, otherBrandName: value }))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Taxa débito (%)"
                      value={form.debitFeePercent}
                      onChange={(e: any) => {
                        const v = Number(e?.target?.value ?? 0);
                        setForm((prev) => ({
                          ...prev,
                          debitFeePercent: Number.isFinite(v) ? v : 0,
                        }));
                      }}
                      inputProps={{ type: "number", step: 0.01 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Taxa crédito à vista (%)"
                      value={form.creditOneShotFeePercent}
                      onChange={(e: any) => {
                        const v = Number(e?.target?.value ?? 0);
                        setForm((prev) => ({
                          ...prev,
                          creditOneShotFeePercent: Number.isFinite(v) ? v : 0,
                        }));
                      }}
                      inputProps={{ type: "number", step: 0.01 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <InstallmentsCard
                      installmentFees={form.installmentFees}
                      anticipateReceivables={form.anticipateReceivables}
                      onToggleAnticipate={() =>
                        setForm((prev) => ({
                          ...prev,
                          anticipateReceivables: !prev.anticipateReceivables,
                        }))
                      }
                      onToggleInstallment={handleInstallmentToggle}
                      onChangeInstallmentFee={handleInstallmentFeeChange}
                      onAddInstallment={handleAddInstallment}
                    />
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Excluir adquirinte</DialogTitle>
        <DialogContent>
          <MDBox pt={1}>
            <MDTypography variant="body2" color="text">
              Tem certeza que deseja excluir esta adquirinte?
            </MDTypography>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton variant="outlined" color="secondary" onClick={closeDeleteDialog}>
            Cancelar
          </MDButton>
          <MDButton variant="gradient" color="error" onClick={confirmDelete}>
            Excluir
          </MDButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default AcquirersPage;
