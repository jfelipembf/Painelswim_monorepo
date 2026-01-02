import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";

import type { FormikErrors, FormikTouched } from "formik";

import type { ActivityFormValues } from "../types";
import type { ActivityStatus } from "hooks/activities";

type Props = {
  values: ActivityFormValues;
  errors: FormikErrors<ActivityFormValues>;
  touched: FormikTouched<ActivityFormValues>;
  setFieldValue: (field: keyof ActivityFormValues, value: unknown) => void;
};

function ActivityFormFields({ values, errors, touched, setFieldValue }: Props): JSX.Element {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MDInput
          name="name"
          label="Nome da atividade"
          variant="standard"
          fullWidth
          value={values.name}
          onChange={(event: any) => setFieldValue("name", event.target.value)}
          error={Boolean(touched.name && errors.name)}
          helperText={touched.name && errors.name ? errors.name : " "}
        />
      </Grid>

      <Grid item xs={12}>
        <MDInput
          name="description"
          label="Descrição da atividade"
          variant="standard"
          fullWidth
          multiline
          rows={3}
          value={values.description}
          onChange={(event: any) => setFieldValue("description", event.target.value)}
          error={Boolean(touched.description && errors.description)}
          helperText={touched.description && errors.description ? errors.description : " "}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <MDInput
          name="color"
          label="Cor da atividade"
          type="color"
          variant="standard"
          fullWidth
          value={values.color}
          onChange={(event: any) => setFieldValue("color", event.target.value)}
          error={Boolean(touched.color && errors.color)}
          helperText={touched.color && errors.color ? errors.color : " "}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth variant="standard" error={Boolean(touched.status && errors.status)}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            value={values.status}
            onChange={(event) => setFieldValue("status", event.target.value as ActivityStatus)}
          >
            <MenuItem value="active">Ativo</MenuItem>
            <MenuItem value="inactive">Inativo</MenuItem>
          </Select>
          <MDBox mt={0.75}>
            <MDTypography component="div" variant="caption" color="error" fontWeight="regular">
              {touched.status && errors.status ? (errors.status as string) : " "}
            </MDTypography>
          </MDBox>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={values.shareWithOtherUnits}
              onChange={(event) => setFieldValue("shareWithOtherUnits", event.target.checked)}
            />
          }
          label="Compartilhar esta atividade com outras unidades"
        />
      </Grid>
    </Grid>
  );
}

export default ActivityFormFields;
