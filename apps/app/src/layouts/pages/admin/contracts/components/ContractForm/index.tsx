import React from "react";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { MEMBERSHIP_DURATION_TYPES, MEMBERSHIP_DURATION_TYPE_LABELS } from "constants/membership";
import { WEEKDAYS, WEEKDAY_LABELS } from "constants/weekdays";

import type { ContractFormValues } from "../../types";
import { FormField } from "components";

type Props = {
  values: ContractFormValues;
  setFieldValue: (field: keyof ContractFormValues, value: unknown) => void;
  isEditMode: boolean;
  existingLoading: boolean;
  availableBranches: any[];
  currentBranchId: string;
  isSaving: boolean;
  showSavingSpinner: boolean;
  onSubmitRequested: () => void;
};

function ContractForm({
  values,
  setFieldValue,
  isEditMode,
  existingLoading,
  isSaving,
  showSavingSpinner,
  onSubmitRequested,
}: Props) {
  return (
    <>
      <Card sx={{ overflow: "visible" }}>
        <MDBox p={3}>
          <MDTypography variant="h5">{isEditMode ? "Editar contrato" : "Contrato"}</MDTypography>
        </MDBox>
        <MDBox pb={3} px={3}>
          {existingLoading ? (
            <MDBox display="flex" justifyContent="center" py={6}>
              <CircularProgress color="info" />
            </MDBox>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Nome"
                  name="name"
                  value={values.name}
                  onChange={(e: any) => setFieldValue("name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Preço (R$)"
                  name="price"
                  value={values.price}
                  inputProps={{ type: "number" }}
                  onChange={(e: any) => setFieldValue("price", e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormField
                  label="Descrição"
                  name="description"
                  value={values.description}
                  onChange={(e: any) => setFieldValue("description", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Autocomplete
                      options={Object.values(MEMBERSHIP_DURATION_TYPES)}
                      value={values.durationType}
                      onChange={(_, value) => setFieldValue("durationType", value)}
                      renderInput={(params) => (
                        <FormField {...params} label="Duração" InputLabelProps={{ shrink: true }} />
                      )}
                      getOptionLabel={(opt: any) => MEMBERSHIP_DURATION_TYPE_LABELS[opt] || opt}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormField
                      label="Quantidade"
                      name="duration"
                      value={values.duration}
                      inputProps={{ type: "number" }}
                      onChange={(e: any) => setFieldValue("duration", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormField
                      label="Máx. parcelas"
                      name="maxInstallments"
                      value={values.maxInstallments}
                      inputProps={{ type: "number" }}
                      onChange={(e: any) => setFieldValue("maxInstallments", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </MDBox>
      </Card>

      <MDBox mt={3}>
        <Card sx={{ overflow: "visible" }}>
          <MDBox p={3}>
            <MDTypography variant="h5">Regras</MDTypography>
          </MDBox>
          <MDBox pb={3} px={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <MDTypography variant="h6" fontWeight="medium">
                  Suspensão
                </MDTypography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={[
                    { value: true, label: "Sim" },
                    { value: false, label: "Não" },
                  ]}
                  value={
                    values.allowFreeze
                      ? { value: true, label: "Sim" }
                      : { value: false, label: "Não" }
                  }
                  onChange={(_, option) => setFieldValue("allowFreeze", Boolean(option?.value))}
                  getOptionLabel={(opt: any) => opt?.label || ""}
                  isOptionEqualToValue={(opt: any, val: any) => opt?.value === val?.value}
                  renderInput={(params) => (
                    <FormField
                      {...params}
                      label="Permite suspensão"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField
                  label="Quantidade (vezes)"
                  name="maxSuspensionTimes"
                  value={values.maxSuspensionTimes}
                  inputProps={{ type: "number" }}
                  onChange={(e: any) => setFieldValue("maxSuspensionTimes", e.target.value)}
                  disabled={!values.allowFreeze}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField
                  label="Max dias"
                  name="maxSuspensionDays"
                  value={values.maxSuspensionDays}
                  inputProps={{ type: "number" }}
                  onChange={(e: any) => setFieldValue("maxSuspensionDays", e.target.value)}
                  disabled={!values.allowFreeze}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField
                  label="Min dias"
                  name="minimumSuspensionDays"
                  value={values.minimumSuspensionDays}
                  inputProps={{ type: "number" }}
                  onChange={(e: any) => setFieldValue("minimumSuspensionDays", e.target.value)}
                  disabled={!values.allowFreeze}
                />
              </Grid>

              <Grid item xs={12}>
                <MDTypography variant="h6" fontWeight="medium">
                  Acesso
                </MDTypography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  options={Object.values(WEEKDAYS)}
                  value={Array.isArray(values.allowedWeekdays) ? values.allowedWeekdays : []}
                  onChange={(_, selected: any[]) =>
                    setFieldValue("allowedWeekdays", Array.isArray(selected) ? selected : [])
                  }
                  getOptionLabel={(opt: any) => WEEKDAY_LABELS[opt] || String(opt)}
                  isOptionEqualToValue={(opt: any, val: any) => opt === val}
                  renderInput={(params) => (
                    <FormField
                      {...params}
                      label="Dias permitidos"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={[
                    { value: "unlimited", label: "Ilimitadas" },
                    { value: "limited", label: "Por quantidade" },
                  ]}
                  value={
                    values.accessControl === "limited"
                      ? { value: "limited", label: "Por quantidade" }
                      : { value: "unlimited", label: "Ilimitadas" }
                  }
                  onChange={(_, option) => setFieldValue("accessControl", option?.value)}
                  getOptionLabel={(opt: any) => opt?.label || ""}
                  isOptionEqualToValue={(opt: any, val: any) => opt?.value === val?.value}
                  renderInput={(params) => (
                    <FormField
                      {...params}
                      label="Controle de acesso"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormField
                  label="Quant. de entradas"
                  name="accessLimitCount"
                  value={values.accessLimitCount}
                  inputProps={{ type: "number" }}
                  onChange={(e: any) => setFieldValue("accessLimitCount", e.target.value)}
                  disabled={values.accessControl !== "limited"}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Autocomplete
                  options={[
                    { value: "day", label: "Dia" },
                    { value: "week", label: "Semana" },
                    { value: "month", label: "Mensal" },
                    { value: "period", label: "Período" },
                  ]}
                  value={(() => {
                    const map: any = {
                      day: { value: "day", label: "Dia" },
                      week: { value: "week", label: "Semana" },
                      month: { value: "month", label: "Mensal" },
                      period: { value: "period", label: "Período" },
                    };
                    return map[values.accessLimitPeriod] || map.month;
                  })()}
                  onChange={(_, option) => setFieldValue("accessLimitPeriod", option?.value)}
                  getOptionLabel={(opt: any) => opt?.label || ""}
                  isOptionEqualToValue={(opt: any, val: any) => opt?.value === val?.value}
                  renderInput={(params) => (
                    <FormField {...params} label="Período" InputLabelProps={{ shrink: true }} />
                  )}
                  disabled={values.accessControl !== "limited"}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={[
                    { value: true, label: "Sim" },
                    { value: false, label: "Não" },
                  ]}
                  value={
                    values.unlimitedInOriginBranch
                      ? { value: true, label: "Sim" }
                      : { value: false, label: "Não" }
                  }
                  onChange={(_, option) =>
                    setFieldValue("unlimitedInOriginBranch", Boolean(option?.value))
                  }
                  getOptionLabel={(opt: any) => opt?.label || ""}
                  isOptionEqualToValue={(opt: any, val: any) => opt?.value === val?.value}
                  renderInput={(params) => (
                    <FormField
                      {...params}
                      label="Acessos ilimitados na unidade de origem"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <MDTypography variant="h6" fontWeight="medium">
                  Cancelamento
                </MDTypography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={[
                    { value: false, label: "Não" },
                    { value: true, label: "Sim" },
                  ]}
                  value={
                    values.allowsCancellationByApp
                      ? { value: true, label: "Sim" }
                      : { value: false, label: "Não" }
                  }
                  onChange={(_, option) =>
                    setFieldValue("allowsCancellationByApp", Boolean(option?.value))
                  }
                  getOptionLabel={(opt: any) => opt?.label || ""}
                  isOptionEqualToValue={(opt: any, val: any) => opt?.value === val?.value}
                  renderInput={(params) => (
                    <FormField
                      {...params}
                      label="Permite cancelamento pelo app"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <MDBox mt={2} display="flex" justifyContent="flex-end">
                  <MDButton
                    type="submit"
                    variant="gradient"
                    color="dark"
                    disabled={isSaving}
                    onClick={onSubmitRequested}
                  >
                    {showSavingSpinner ? <CircularProgress color="inherit" size={18} /> : "Salvar"}
                  </MDButton>
                </MDBox>
              </Grid>
            </Grid>
          </MDBox>
        </Card>
      </MDBox>
    </>
  );
}

export default ContractForm;
