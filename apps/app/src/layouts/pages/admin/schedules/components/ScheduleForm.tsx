import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";

import { WEEKDAY_LABELS, WEEKDAY_OPTIONS } from "constants/weekdays";

import type { ScheduleFormValues } from "../types";
import { FormField } from "components";

type WeekdayOption = {
  value: number;
  label: string;
};

type Props = {
  values: ScheduleFormValues;
  errors: any;
  touched: any;
  handleChange: any;
  setFieldValue: any;
  activities: any[];
  instructors: any[];
  areas: any[];
  disabled?: boolean;
};

function ScheduleForm({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
  activities,
  instructors,
  areas,
  disabled,
}: Props): JSX.Element {
  const computeEndTime = (startTime: string, durationMinutes: number) => {
    const parts = String(startTime || "").split(":");
    if (parts.length !== 2) return "";
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return "";

    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) return "";

    const totalMinutes = hours * 60 + minutes + duration;
    const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const endHours = Math.floor(normalized / 60);
    const endMinutes = normalized % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormField
          select
          label="Atividade"
          name="idActivity"
          value={values.idActivity}
          onChange={handleChange}
          disabled={Boolean(disabled)}
          error={Boolean(touched.idActivity && errors.idActivity)}
          helperText={touched.idActivity && (errors.idActivity as string)}
        >
          {activities.map((a: any) => (
            <MenuItem key={a.id} value={a.id}>
              {a?.name || a.id}
            </MenuItem>
          ))}
        </FormField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormField
          select
          label="Instrutor"
          name="idEmployee"
          value={values.idEmployee}
          onChange={handleChange}
          disabled={Boolean(disabled)}
          error={Boolean(touched.idEmployee && errors.idEmployee)}
          helperText={touched.idEmployee && (errors.idEmployee as string)}
        >
          {instructors.map((e: any) => (
            <MenuItem key={e.id} value={e.id}>
              {e?.name || e.id}
            </MenuItem>
          ))}
        </FormField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormField
          select
          label="Área"
          name="idArea"
          value={values.idArea}
          onChange={handleChange}
          disabled={Boolean(disabled)}
          error={Boolean(touched.idArea && errors.idArea)}
          helperText={touched.idArea && (errors.idArea as string)}
        >
          {areas.map((a: any) => (
            <MenuItem key={a.id} value={a.id}>
              {a?.name || a.id}
            </MenuItem>
          ))}
        </FormField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete<WeekdayOption, true, false, false>
          multiple
          options={WEEKDAY_OPTIONS}
          value={(Array.isArray(values.weekDays) ? values.weekDays : [])
            .map((value: number) => ({
              value,
              label: WEEKDAY_LABELS[value] || String(value),
            }))
            .filter((opt: WeekdayOption) => opt.label)}
          getOptionLabel={(opt: WeekdayOption) => opt.label}
          onChange={(_, newValue) => {
            const ids = Array.isArray(newValue) ? newValue.map((v: any) => Number(v.value)) : [];
            setFieldValue("weekDays", ids);
          }}
          renderInput={(params) => (
            <FormField
              {...params}
              label="Dias da semana"
              disabled={Boolean(disabled)}
              error={Boolean(touched.weekDays && errors.weekDays)}
              helperText={touched.weekDays && (errors.weekDays as string)}
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormField
              label="Hora"
              name="startTime"
              type="time"
              value={values.startTime}
              onChange={(e: any) => {
                const nextStartTime = String(e?.target?.value || "");
                handleChange(e);
                const computed = computeEndTime(nextStartTime, values.durationMinutes);
                setFieldValue("endTime", computed);
              }}
              disabled={Boolean(disabled)}
              error={Boolean(touched.startTime && errors.startTime)}
              helperText={touched.startTime && (errors.startTime as string)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormField
              label="Duração (min)"
              name="durationMinutes"
              type="number"
              value={values.durationMinutes}
              onChange={(e: any) => {
                const nextDuration = Number(e?.target?.value);
                handleChange(e);
                const computed = computeEndTime(values.startTime, nextDuration);
                setFieldValue("endTime", computed);
              }}
              disabled={Boolean(disabled)}
              error={Boolean(touched.durationMinutes && errors.durationMinutes)}
              helperText={touched.durationMinutes && (errors.durationMinutes as string)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormField
              label="Capacidade máxima"
              name="maxCapacity"
              type="number"
              value={values.maxCapacity}
              onChange={handleChange}
              disabled={Boolean(disabled)}
              error={Boolean(touched.maxCapacity && errors.maxCapacity)}
              helperText={touched.maxCapacity && (errors.maxCapacity as string)}
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormField
          label="Data início"
          name="startDate"
          type="date"
          value={values.startDate}
          onChange={handleChange}
          disabled={Boolean(disabled)}
          error={Boolean(touched.startDate && errors.startDate)}
          helperText={touched.startDate && (errors.startDate as string)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormField
          label="Data fim"
          name="endDate"
          type="date"
          value={values.endDate}
          onChange={handleChange}
          disabled={Boolean(disabled)}
          error={Boolean(touched.endDate && errors.endDate)}
          helperText={touched.endDate && (errors.endDate as string)}
        />
      </Grid>
    </Grid>
  );
}

export default ScheduleForm;
