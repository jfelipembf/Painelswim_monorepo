import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";

import { Portuguese } from "flatpickr/dist/l10n/pt";

import { GENDER_LABELS, GENDERS } from "constants/gender";
import { MONTHS } from "constants/months";

import {
  CRM_ACTIVITIES,
  CRM_CONSULTANTS,
  CRM_CONTRACTS,
  CRM_INSTRUCTORS,
} from "layouts/pages/crm/constants";

import MDBox from "components/MDBox";
import MDDatePicker from "components/MDDatePicker";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

import type { ClientFiltersActions, ClientFiltersState } from "layouts/pages/crm/types";
import { parseDateParts } from "layouts/pages/crm/utils";

type Props = {
  filters: ClientFiltersState;
  actions: ClientFiltersActions;
};

function ClientFiltersForm({ filters, actions }: Props): JSX.Element {
  const toPickerValue = (value: string): Date[] => {
    const parts = parseDateParts(value);
    if (!parts) return [];
    return [new Date(parts.year, parts.month - 1, parts.day)];
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePickerChange = (dates: Date[], setter: (value: string) => void, enabled = true) => {
    if (!enabled) return;
    const next = dates?.[0];
    if (next instanceof Date && !Number.isNaN(next.getTime())) {
      setter(formatDateKey(next));
      return;
    }
    setter("");
  };

  const {
    active,
    inactive,
    paused,
    city,
    neighborhood,
    gender,
    birthMonth,
    age,
    birthDate,
    hasDebt,
    overdueDebt,
    debtDueThisMonth,
    instructor,
    consultant,
    activity,
    boughtBetweenEnabled,
    boughtBetweenStart,
    boughtBetweenEnd,
    withValueEnabled,
    minValue,
    maxValue,
    startEnabled,
    startDate,
    startEndDate,
    dueEnabled,
    dueStart,
    dueEnd,
    cancelEnabled,
    cancelStart,
    cancelEnd,
    contractActiveEnabled,
    contractActive,
    contractInactiveEnabled,
    contractInactive,
  } = filters;

  const {
    setActive,
    setInactive,
    setPaused,
    setCity,
    setNeighborhood,
    setGender,
    setBirthMonth,
    setAge,
    setBirthDate,
    setHasDebt,
    setOverdueDebt,
    setDebtDueThisMonth,
    setInstructor,
    setConsultant,
    setActivity,
    setBoughtBetweenEnabled,
    setBoughtBetweenStart,
    setBoughtBetweenEnd,
    setWithValueEnabled,
    setMinValue,
    setMaxValue,
    setStartEnabled,
    setStartDate,
    setStartEndDate,
    setDueEnabled,
    setDueStart,
    setDueEnd,
    setCancelEnabled,
    setCancelStart,
    setCancelEnd,
    setContractActiveEnabled,
    setContractActive,
    setContractInactiveEnabled,
    setContractInactive,
  } = actions;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={6}>
        <Card>
          <MDBox p={3}>
            <MDTypography variant="button" fontWeight="medium" color="text">
              Informações de Cliente
            </MDTypography>

            <MDBox mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <MDBox display="flex" flexWrap="wrap" gap={2}>
                    <FormControlLabel
                      control={
                        <Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} />
                      }
                      label="Ativos"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={inactive}
                          onChange={(e) => setInactive(e.target.checked)}
                        />
                      }
                      label="Inativos"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox checked={paused} onChange={(e) => setPaused(e.target.checked)} />
                      }
                      label="Suspensos"
                    />
                  </MDBox>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormField
                    label="Cidade"
                    value={city}
                    onChange={(e: any) => setCity(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormField
                    label="Bairro"
                    value={neighborhood}
                    onChange={(e: any) => setNeighborhood(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormField
                    label="Gênero"
                    select
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {GENDERS.map((g) => (
                      <MenuItem key={g} value={g}>
                        {GENDER_LABELS[g]}
                      </MenuItem>
                    ))}
                  </FormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormField
                    label="Mês de nascimento"
                    select
                    value={birthMonth}
                    onChange={(e: any) => setBirthMonth(e.target.value)}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {MONTHS.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </FormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormField
                    label="Idade"
                    value={age}
                    onChange={(e: any) => setAge(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <MDDatePicker
                    value={toPickerValue(birthDate)}
                    options={{
                      dateFormat: "d/m/Y",
                      locale: Portuguese,
                    }}
                    onChange={(dates: any[]) => handlePickerChange(dates, setBirthDate)}
                    input={{
                      label: "Data de nascimento",
                      fullWidth: true,
                      InputLabelProps: { shrink: true },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <MDBox display="flex" flexDirection="column">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={hasDebt}
                          onChange={(e) => setHasDebt(e.target.checked)}
                        />
                      }
                      label="Com débito"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={overdueDebt}
                          onChange={(e) => setOverdueDebt(e.target.checked)}
                        />
                      }
                      label="Com débito vencido"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={debtDueThisMonth}
                          onChange={(e) => setDebtDueThisMonth(e.target.checked)}
                        />
                      }
                      label="Com débito a vencer neste mês"
                    />
                  </MDBox>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormField
                    label="Professor"
                    select
                    value={instructor}
                    onChange={(e: any) => setInstructor(e.target.value)}
                  >
                    {CRM_INSTRUCTORS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </FormField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormField
                    label="Consultor"
                    select
                    value={consultant}
                    onChange={(e: any) => setConsultant(e.target.value)}
                  >
                    {CRM_CONSULTANTS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </FormField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormField
                    label="Atividade"
                    select
                    value={activity}
                    onChange={(e: any) => setActivity(e.target.value)}
                  >
                    {CRM_ACTIVITIES.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </FormField>
                </Grid>
              </Grid>
            </MDBox>
          </MDBox>
        </Card>
      </Grid>

      <Grid item xs={12} lg={6}>
        <Card>
          <MDBox p={3}>
            <MDTypography variant="button" fontWeight="medium" color="text">
              Informações de Contrato
            </MDTypography>

            <MDBox mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={boughtBetweenEnabled}
                        onChange={(e) => setBoughtBetweenEnabled(e.target.checked)}
                      />
                    }
                    label="Compraram entre"
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <MDDatePicker
                        value={toPickerValue(boughtBetweenStart)}
                        options={{
                          dateFormat: "d/m/Y",
                          locale: Portuguese,
                        }}
                        onChange={(dates: any[]) =>
                          handlePickerChange(dates, setBoughtBetweenStart, boughtBetweenEnabled)
                        }
                        input={{
                          label: "Início",
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          disabled: !boughtBetweenEnabled,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDDatePicker
                        value={toPickerValue(boughtBetweenEnd)}
                        options={{
                          dateFormat: "d/m/Y",
                          locale: Portuguese,
                        }}
                        onChange={(dates: any[]) =>
                          handlePickerChange(dates, setBoughtBetweenEnd, boughtBetweenEnabled)
                        }
                        input={{
                          label: "Fim",
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          disabled: !boughtBetweenEnabled,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={withValueEnabled}
                        onChange={(e) => setWithValueEnabled(e.target.checked)}
                      />
                    }
                    label="Com valor"
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormField
                        label="De (R$)"
                        value={minValue}
                        onChange={(e: any) => setMinValue(e.target.value)}
                        disabled={!withValueEnabled}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormField
                        label="Até (R$)"
                        value={maxValue}
                        onChange={(e: any) => setMaxValue(e.target.value)}
                        disabled={!withValueEnabled}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={startEnabled}
                        onChange={(e) => setStartEnabled(e.target.checked)}
                      />
                    }
                    label="Início entre"
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <MDDatePicker
                        value={toPickerValue(startDate)}
                        options={{
                          dateFormat: "d/m/Y",
                          locale: Portuguese,
                        }}
                        onChange={(dates: any[]) =>
                          handlePickerChange(dates, setStartDate, startEnabled)
                        }
                        input={{
                          label: "Início",
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          disabled: !startEnabled,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDDatePicker
                        value={toPickerValue(startEndDate)}
                        options={{
                          dateFormat: "d/m/Y",
                          locale: Portuguese,
                        }}
                        onChange={(dates: any[]) =>
                          handlePickerChange(dates, setStartEndDate, startEnabled)
                        }
                        input={{
                          label: "Fim",
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          disabled: !startEnabled,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={dueEnabled}
                        onChange={(e) => setDueEnabled(e.target.checked)}
                      />
                    }
                    label="Vencimento entre"
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <MDDatePicker
                        value={toPickerValue(dueStart)}
                        options={{
                          dateFormat: "d/m/Y",
                          locale: Portuguese,
                        }}
                        onChange={(dates: any[]) =>
                          handlePickerChange(dates, setDueStart, dueEnabled)
                        }
                        input={{
                          label: "Início",
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          disabled: !dueEnabled,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDDatePicker
                        value={toPickerValue(dueEnd)}
                        options={{
                          dateFormat: "d/m/Y",
                          locale: Portuguese,
                        }}
                        onChange={(dates: any[]) =>
                          handlePickerChange(dates, setDueEnd, dueEnabled)
                        }
                        input={{
                          label: "Fim",
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          disabled: !dueEnabled,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={cancelEnabled}
                        onChange={(e) => setCancelEnabled(e.target.checked)}
                      />
                    }
                    label="Cancelamento entre"
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <MDDatePicker
                        value={toPickerValue(cancelStart)}
                        options={{
                          dateFormat: "d/m/Y",
                          locale: Portuguese,
                        }}
                        onChange={(dates: any[]) =>
                          handlePickerChange(dates, setCancelStart, cancelEnabled)
                        }
                        input={{
                          label: "Início",
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          disabled: !cancelEnabled,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDDatePicker
                        value={toPickerValue(cancelEnd)}
                        options={{
                          dateFormat: "d/m/Y",
                          locale: Portuguese,
                        }}
                        onChange={(dates: any[]) =>
                          handlePickerChange(dates, setCancelEnd, cancelEnabled)
                        }
                        input={{
                          label: "Fim",
                          fullWidth: true,
                          InputLabelProps: { shrink: true },
                          disabled: !cancelEnabled,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contractActiveEnabled}
                        onChange={(e) => setContractActiveEnabled(e.target.checked)}
                      />
                    }
                    label="Contrato ativo"
                  />
                  <FormField
                    select
                    label=""
                    value={contractActive}
                    onChange={(e: any) => setContractActive(e.target.value)}
                    disabled={!contractActiveEnabled}
                  >
                    {CRM_CONTRACTS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </FormField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contractInactiveEnabled}
                        onChange={(e) => setContractInactiveEnabled(e.target.checked)}
                      />
                    }
                    label="Contrato inativo"
                  />
                  <FormField
                    select
                    label=""
                    value={contractInactive}
                    onChange={(e: any) => setContractInactive(e.target.value)}
                    disabled={!contractInactiveEnabled}
                  >
                    {CRM_CONTRACTS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </FormField>
                </Grid>
              </Grid>
            </MDBox>
          </MDBox>
        </Card>
      </Grid>
    </Grid>
  );
}

export default ClientFiltersForm;
