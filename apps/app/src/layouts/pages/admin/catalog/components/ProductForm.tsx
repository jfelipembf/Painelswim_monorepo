import { useMemo } from "react";

import { Form, Formik } from "formik";
import * as Yup from "yup";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { Product, ProductPayload } from "hooks/products";
import { FormField } from "components";

type Props = {
  saving?: boolean;
  error?: string | null;
  initialData?: Product | null;
  onSubmit?: (values: ProductPayload) => Promise<void>;
  onCancel?: () => void;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Nome é obrigatório."),
  salePrice: Yup.number().min(0, "Valor inválido.").required("Valor de venda é obrigatório."),
  purchasePrice: Yup.number().min(0, "Valor inválido.").required("Valor de compra é obrigatório."),
  minStockQty: Yup.number().min(0, "Valor inválido.").required("Estoque mínimo é obrigatório."),
  stockQty: Yup.number().min(0, "Valor inválido.").required("Estoque é obrigatório."),
  inactive: Yup.boolean(),
});

function ProductForm({
  saving = false,
  error = null,
  initialData,
  onSubmit,
  onCancel,
}: Props): JSX.Element {
  const isEditMode = Boolean(initialData?.id);
  const legacyPriceCents =
    typeof (initialData as { priceCents?: number } | null)?.priceCents === "number"
      ? (initialData as { priceCents?: number }).priceCents
      : undefined;

  const uiValues = useMemo(
    () => ({
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      purchasePrice:
        typeof initialData?.purchasePriceCents === "number"
          ? initialData.purchasePriceCents / 100
          : 0,
      salePrice:
        typeof initialData?.salePriceCents === "number"
          ? initialData.salePriceCents / 100
          : typeof legacyPriceCents === "number"
          ? legacyPriceCents / 100
          : 0,
      sku: initialData?.sku ?? "",
      barcode: initialData?.barcode ?? "",
      stockQty: typeof initialData?.stockQty === "number" ? initialData.stockQty : 0,
      minStockQty: typeof initialData?.minStockQty === "number" ? initialData.minStockQty : 0,
      inactive: Boolean(initialData?.inactive),
    }),
    [initialData, legacyPriceCents]
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
              purchasePriceCents: Math.round(Number(values.purchasePrice || 0) * 100),
              salePriceCents: Math.round(Number(values.salePrice || 0) * 100),
              sku: values.sku,
              barcode: values.barcode,
              stockQty: Math.round(Number(values.stockQty || 0)),
              minStockQty: Math.round(Number(values.minStockQty || 0)),
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
                {isEditMode ? "Editar produto" : "Novo produto"}
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

                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Valor de venda (R$)"
                    name="salePrice"
                    inputProps={{ type: "number" }}
                    disabled={saving || isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Valor de compra (R$)"
                    name="purchasePrice"
                    inputProps={{ type: "number" }}
                    disabled={saving || isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Estoque mínimo"
                    name="minStockQty"
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

                <Grid item xs={12}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <FormField label="SKU" name="sku" disabled={saving || isSubmitting} />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormField
                        label="Código de barras"
                        name="barcode"
                        disabled={saving || isSubmitting}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormField
                        label="Estoque"
                        name="stockQty"
                        inputProps={{ type: "number" }}
                        disabled={saving || isSubmitting}
                      />
                    </Grid>
                  </Grid>
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

export default ProductForm;
