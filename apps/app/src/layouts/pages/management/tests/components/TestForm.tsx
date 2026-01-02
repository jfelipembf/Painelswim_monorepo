import { useEffect, useMemo, useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

import { secondsToTimeParts, timePartsToSecondsString, type TestMode } from "hooks/tests";

import type { TestFormValues, TestItem } from "../types";

type Props = {
  saving?: boolean;
  error?: string | null;
  mode: TestMode;
  initialData?: TestItem | null;
  onSubmit: (values: TestFormValues) => Promise<void> | void;
  onReset?: () => void;
};

function TestForm({
  saving = false,
  error = null,
  mode,
  initialData,
  onSubmit,
  onReset,
}: Props): JSX.Element {
  const isEditMode = Boolean(initialData?.id);

  const [formValues, setFormValues] = useState<TestFormValues>({
    name: "",
    fixedDistanceMeters: "",
    fixedTimeSeconds: "",
    inactive: false,
  });

  useEffect(() => {
    setFormValues({
      name: initialData?.name || "",
      fixedDistanceMeters:
        typeof initialData?.fixedDistanceMeters === "number"
          ? String(initialData.fixedDistanceMeters)
          : "",
      fixedTimeSeconds:
        typeof initialData?.fixedTimeSeconds === "number"
          ? String(initialData.fixedTimeSeconds)
          : "",
      inactive: Boolean(initialData?.inactive),
    });
  }, [initialData]);

  const title = useMemo(() => {
    if (mode === "distance")
      return isEditMode ? "Editar teste (distância fixa)" : "Novo teste (distância fixa)";
    return isEditMode ? "Editar teste (tempo fixo)" : "Novo teste (tempo fixo)";
  }, [isEditMode, mode]);

  const handleChange =
    (field: keyof TestFormValues) =>
    (event: any): void => {
      const value = field === "inactive" ? !formValues.inactive : event.target.value;
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formValues);
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
          <MDTypography variant="h5">{title}</MDTypography>

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
            <Grid item xs={12}>
              <FormField
                label="Nome"
                value={formValues.name}
                onChange={handleChange("name")}
                disabled={saving}
              />
            </Grid>

            {mode === "distance" ? (
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Distância fixa (m)"
                  type="number"
                  value={formValues.fixedDistanceMeters}
                  onChange={handleChange("fixedDistanceMeters")}
                  disabled={saving}
                />
              </Grid>
            ) : (
              <Grid item xs={12} sm={6}>
                <MDBox>
                  <MDTypography variant="button" fontWeight="medium" color="text" sx={{ mb: 0.75 }}>
                    Tempo fixo
                  </MDTypography>

                  {(() => {
                    const parts = secondsToTimeParts(formValues.fixedTimeSeconds);
                    const setPart = (key: "hh" | "mm" | "ss") => (e: any) => {
                      const nextVal = String(e?.target?.value ?? "");
                      const current = secondsToTimeParts(formValues.fixedTimeSeconds);
                      const secondsString = timePartsToSecondsString({
                        hh: key === "hh" ? nextVal : current.hh,
                        mm: key === "mm" ? nextVal : current.mm,
                        ss: key === "ss" ? nextVal : current.ss,
                      });
                      setFormValues((prev) => ({
                        ...prev,
                        fixedTimeSeconds: secondsString,
                      }));
                    };

                    return (
                      <MDBox display="flex" gap={1} alignItems="flex-end">
                        <FormField
                          label="HH"
                          value={parts.hh}
                          onChange={setPart("hh")}
                          disabled={saving}
                          inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 4 }}
                          sx={{ width: 86 }}
                        />
                        <FormField
                          label="MM"
                          value={parts.mm}
                          onChange={setPart("mm")}
                          disabled={saving}
                          inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 }}
                          sx={{ width: 86 }}
                        />
                        <FormField
                          label="SS"
                          value={parts.ss}
                          onChange={setPart("ss")}
                          disabled={saving}
                          inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 }}
                          sx={{ width: 86 }}
                        />
                      </MDBox>
                    );
                  })()}
                </MDBox>
              </Grid>
            )}

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
                    const blankValues: TestFormValues = {
                      name: "",
                      fixedDistanceMeters: "",
                      fixedTimeSeconds: "",
                      inactive: false,
                    };

                    const resetValues: TestFormValues = isEditMode
                      ? {
                          name: initialData?.name || "",
                          fixedDistanceMeters:
                            typeof initialData?.fixedDistanceMeters === "number"
                              ? String(initialData.fixedDistanceMeters)
                              : "",
                          fixedTimeSeconds:
                            typeof initialData?.fixedTimeSeconds === "number"
                              ? String(initialData.fixedTimeSeconds)
                              : "",
                          inactive: Boolean(initialData?.inactive),
                        }
                      : blankValues;

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
                  disabled={
                    saving ||
                    !formValues.name.trim() ||
                    (mode === "distance"
                      ? !formValues.fixedDistanceMeters
                      : !formValues.fixedTimeSeconds)
                  }
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

export default TestForm;
