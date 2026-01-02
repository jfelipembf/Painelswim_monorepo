import { useMemo } from "react";

import { Form, Formik } from "formik";
import * as Yup from "yup";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { Area, AreaPayload } from "hooks/areas";
import { FormField } from "components";

type Props = {
  saving?: boolean;
  error?: string | null;
  initialData?: Area | null;
  onSubmit?: (values: AreaPayload) => Promise<void>;
  onCancel?: () => void;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Nome é obrigatório."),
  lengthMeters: Yup.number().min(0, "Valor inválido.").required("Comprimento é obrigatório."),
  widthMeters: Yup.number().min(0, "Valor inválido.").required("Largura é obrigatória."),
  maxCapacity: Yup.number().min(0, "Valor inválido.").required("Capacidade é obrigatória."),
  inactive: Yup.boolean(),
});

function AreaForm({
  saving = false,
  error = null,
  initialData,
  onSubmit,
  onCancel,
}: Props): JSX.Element {
  const isEditMode = Boolean(initialData?.id);

  const uiValues = useMemo(
    () => ({
      name: initialData?.name ?? "",
      lengthMeters: typeof initialData?.lengthMeters === "number" ? initialData.lengthMeters : 0,
      widthMeters: typeof initialData?.widthMeters === "number" ? initialData.widthMeters : 0,
      maxCapacity: typeof initialData?.maxCapacity === "number" ? initialData.maxCapacity : 0,
      inactive: Boolean(initialData?.inactive),
    }),
    [initialData]
  );

  return (
    <Card sx={{ overflow: "visible" }}>
      <Formik
        initialValues={uiValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={async (values, actions) => {
          try {
            if (!onSubmit) return;
            await onSubmit(values);
          } finally {
            actions.setSubmitting(false);
          }
        }}
      >
        {({ values, isSubmitting, setFieldValue }) => (
          <Form autoComplete="off">
            <MDBox
              p={3}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={2}
            >
              <MDTypography variant="h5">{isEditMode ? "Editar area" : "Nova area"}</MDTypography>

              <MDBox display="flex" alignItems="center" gap={1.5}>
                <MDTypography
                  variant="button"
                  fontWeight="medium"
                  color={values.inactive ? "secondary" : "success"}
                >
                  {values.inactive ? "Inativo" : "Ativo"}
                </MDTypography>

                <Switch
                  checked={!values.inactive}
                  disabled={saving || isSubmitting}
                  onChange={(e) => setFieldValue("inactive", !e.target.checked)}
                />
              </MDBox>
            </MDBox>

            <MDBox pb={3} px={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormField label="Nome" name="name" disabled={saving || isSubmitting} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormField
                    label="Comprimento (m)"
                    name="lengthMeters"
                    inputProps={{ type: "number" }}
                    disabled={saving || isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormField
                    label="Largura (m)"
                    name="widthMeters"
                    inputProps={{ type: "number" }}
                    disabled={saving || isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormField
                    label="Capacidade maxima"
                    name="maxCapacity"
                    inputProps={{ type: "number" }}
                    disabled={saving || isSubmitting}
                  />
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
                      color="info"
                      disabled={saving || isSubmitting}
                      onClick={() => {
                        onCancel?.();
                      }}
                    >
                      {isEditMode ? "Desfazer" : "Limpar"}
                    </MDButton>

                    <MDButton
                      type="submit"
                      variant="gradient"
                      color="info"
                      disabled={saving || isSubmitting || !onSubmit}
                    >
                      {isEditMode ? "Salvar" : "Criar"}
                    </MDButton>
                  </MDBox>
                </Grid>
              </Grid>
            </MDBox>
          </Form>
        )}
      </Formik>
    </Card>
  );
}

export default AreaForm;
