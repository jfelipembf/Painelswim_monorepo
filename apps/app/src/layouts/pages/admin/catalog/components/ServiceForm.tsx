import { useMemo } from "react";

import { Form, Formik } from "formik";
import * as Yup from "yup";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { Service, ServicePayload } from "hooks/services";
import { FormField } from "components";

type Props = {
  saving?: boolean;
  error?: string | null;
  initialData?: Service | null;
  onSubmit?: (values: ServicePayload) => Promise<void>;
  onCancel?: () => void;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Nome é obrigatório."),
  price: Yup.number().min(0, "Valor inválido.").required("Preço é obrigatório."),
  durationMinutes: Yup.number().min(1, "Valor inválido.").required("Duração é obrigatória."),
  inactive: Yup.boolean(),
});

function ServiceForm({
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
      description: initialData?.description ?? "",
      price: typeof initialData?.priceCents === "number" ? initialData.priceCents / 100 : 0,
      durationMinutes:
        typeof initialData?.durationMinutes === "number" ? initialData.durationMinutes : 60,
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
            await onSubmit({
              name: values.name,
              description: values.description,
              priceCents: Math.round(Number(values.price || 0) * 100),
              durationMinutes: Math.round(Number(values.durationMinutes || 0)),
              inactive: Boolean(values.inactive),
            });
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
              <MDTypography variant="h5">
                {isEditMode ? "Editar serviço" : "Novo serviço"}
              </MDTypography>

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
                <Grid item xs={12} sm={6}>
                  <FormField label="Nome" name="name" disabled={saving || isSubmitting} />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormField
                    label="Preço (R$)"
                    name="price"
                    inputProps={{ type: "number" }}
                    disabled={saving || isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormField
                    label="Duração (min)"
                    name="durationMinutes"
                    inputProps={{ type: "number" }}
                    disabled={saving || isSubmitting}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormField
                    label="Descrição"
                    name="description"
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
                      onClick={() => onCancel?.()}
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

export default ServiceForm;
