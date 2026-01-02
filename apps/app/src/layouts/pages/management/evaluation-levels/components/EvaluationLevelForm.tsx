import { useEffect, useMemo, useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

import type { EvaluationLevelFormValues, EvaluationLevelItem } from "../types";

type Props = {
  saving?: boolean;
  error?: string | null;
  initialData?: EvaluationLevelItem | null;
  canAssignToBranch?: boolean;
  onSubmit?: (values: EvaluationLevelFormValues) => Promise<void> | void;
  onReset?: () => void;
};

function EvaluationLevelForm({
  saving = false,
  error = null,
  initialData,
  canAssignToBranch = true,
  onSubmit,
  onReset,
}: Props): JSX.Element {
  const isEditMode = Boolean(initialData?.id);

  const uiValues = useMemo(() => {
    const legacyValue = (initialData as any)?.numericValue;
    const resolvedValue =
      typeof initialData?.value === "number"
        ? initialData.value
        : typeof legacyValue === "number"
        ? legacyValue
        : 0;

    return {
      name: initialData?.name ?? "",
      value: resolvedValue,
      sharedAcrossBranches: !initialData?.idBranch,
      inactive: Boolean(initialData?.inactive),
    };
  }, [initialData]);

  const [formValues, setFormValues] = useState<EvaluationLevelFormValues>({
    name: "",
    value: "0",
    sharedAcrossBranches: true,
    inactive: false,
  });

  useEffect(() => {
    setFormValues({
      name: uiValues.name,
      value: String(uiValues.value ?? 0),
      sharedAcrossBranches: Boolean(uiValues.sharedAcrossBranches),
      inactive: Boolean(uiValues.inactive),
    });
  }, [uiValues]);

  const handleChange =
    (field: keyof typeof formValues) =>
    (event: any): void => {
      const value =
        field === "inactive"
          ? !formValues.inactive
          : field === "sharedAcrossBranches"
          ? !formValues.sharedAcrossBranches
          : event?.target?.value;

      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit?.(formValues);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card sx={{ overflow: "visible" }}>
        <MDBox
          p={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <MDTypography variant="h5">{isEditMode ? "Editar nível" : "Novo nível"}</MDTypography>

          <MDBox display="flex" alignItems="center" gap={1.5}>
            <MDTypography
              variant="button"
              fontWeight="medium"
              color={formValues.inactive ? "secondary" : "success"}
            >
              {formValues.inactive ? "Inativo" : "Ativo"}
            </MDTypography>

            <Switch
              checked={!formValues.inactive}
              disabled={saving}
              onChange={handleChange("inactive")}
            />
          </MDBox>
        </MDBox>

        <MDBox pb={3} px={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <FormField
                label="Nome"
                value={formValues.name}
                onChange={handleChange("name")}
                disabled={saving}
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormField
                label="Valor"
                value={formValues.value}
                onChange={handleChange("value")}
                type="number"
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <MDBox display="flex" alignItems="center" gap={1.5}>
                <Switch
                  checked={Boolean(formValues.sharedAcrossBranches)}
                  disabled={saving || (!isEditMode && !canAssignToBranch)}
                  onChange={handleChange("sharedAcrossBranches")}
                />
                <MDTypography variant="button" fontWeight="regular">
                  Compartilhar entre unidades
                </MDTypography>
              </MDBox>

              {!isEditMode && !canAssignToBranch ? (
                <MDTypography variant="caption" color="text" sx={{ mt: 0.5, display: "block" }}>
                  Para criar um nível exclusivo de uma unidade, selecione uma unidade ativa
                  primeiro.
                </MDTypography>
              ) : null}
            </Grid>

            {error ? (
              <Grid item xs={12}>
                <MDTypography variant="button" color="error" fontWeight="medium">
                  {error}
                </MDTypography>
              </Grid>
            ) : null}

            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="flex-end" gap={2}>
                <MDButton
                  variant="outlined"
                  color="secondary"
                  disabled={saving}
                  onClick={() => {
                    const resetValues = isEditMode
                      ? {
                          name: uiValues.name,
                          value: String(uiValues.value ?? 0),
                          sharedAcrossBranches: Boolean(uiValues.sharedAcrossBranches),
                          inactive: Boolean(uiValues.inactive),
                        }
                      : {
                          name: "",
                          value: "0",
                          sharedAcrossBranches: true,
                          inactive: false,
                        };

                    setFormValues(resetValues);
                    onReset?.();
                  }}
                >
                  {isEditMode ? "Cancelar edição" : "Limpar"}
                </MDButton>

                <MDButton
                  type="submit"
                  variant="gradient"
                  color="info"
                  disabled={saving || !formValues.name.trim()}
                >
                  {isEditMode ? "Salvar" : "Criar"}
                </MDButton>
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </Card>
    </form>
  );
}

export default EvaluationLevelForm;
