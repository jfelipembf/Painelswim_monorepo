import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { Product } from "hooks/products";
import { formatCentsBRL } from "hooks/sales";
import type { CheckoutItem } from "../types";
import { FormField } from "components";

type Props = {
  products: Product[];
  productSelection: string;
  onProductSelectionChange: (value: string) => void;
  onAddProductSelection: () => void;
  productItems: CheckoutItem[];
  onUpdateProductQuantity: (productId: string, quantity: number) => void;
};

const ProductSection = ({
  products,
  productSelection,
  onProductSelectionChange,
  onAddProductSelection,
  productItems,
  onUpdateProductQuantity,
}: Props): JSX.Element => (
  <MDBox mt={2}>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormField
          label="Produto"
          select
          value={productSelection}
          onChange={(event: any) => onProductSelectionChange(event.target.value)}
        >
          <MenuItem value="">Selecione...</MenuItem>
          {products
            .filter((product) => !product.inactive)
            .map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.name} — {formatCentsBRL(Number(product.salePriceCents || 0))}
              </MenuItem>
            ))}
        </FormField>
      </Grid>
      <Grid item xs={12} sm={6} display="flex" alignItems="center">
        <MDButton
          variant="outlined"
          color="info"
          size="small"
          onClick={onAddProductSelection}
          disabled={!productSelection}
          iconOnly
          circular
        >
          +
        </MDButton>
      </Grid>
    </Grid>

    <MDBox mt={2}>
      {productItems.length ? (
        <MDBox display="flex" flexDirection="column" gap={1}>
          {productItems.map((item) => (
            <MDBox
              key={item.id}
              borderRadius="md"
              border="1px solid rgba(0,0,0,0.08)"
              p={2}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <MDBox>
                <MDTypography variant="button" fontWeight="medium">
                  {item.description}
                </MDTypography>
                <MDTypography variant="caption" color="text">
                  {formatCentsBRL(item.unitPriceCents)} × {item.quantity}
                </MDTypography>
              </MDBox>
              <MDBox display="flex" alignItems="center" gap={1}>
                <MDButton
                  variant="outlined"
                  color="info"
                  size="small"
                  onClick={() => onUpdateProductQuantity(item.referenceId || "", item.quantity - 1)}
                >
                  -
                </MDButton>
                <MDTypography variant="button" fontWeight="medium">
                  {item.quantity}
                </MDTypography>
                <MDButton
                  variant="outlined"
                  color="info"
                  size="small"
                  onClick={() => onUpdateProductQuantity(item.referenceId || "", item.quantity + 1)}
                >
                  +
                </MDButton>
                <MDButton
                  variant="text"
                  color="error"
                  size="small"
                  onClick={() => onUpdateProductQuantity(item.referenceId || "", 0)}
                >
                  Remover
                </MDButton>
              </MDBox>
            </MDBox>
          ))}
        </MDBox>
      ) : (
        <MDTypography variant="body2" color="text">
          Nenhum produto adicionado.
        </MDTypography>
      )}
    </MDBox>
  </MDBox>
);

export default ProductSection;
