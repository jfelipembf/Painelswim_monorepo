import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { Service } from "hooks/services";
import { formatCentsBRL } from "hooks/sales";
import type { CheckoutItem } from "../types";
import { FormField } from "components";

type Props = {
  services: Service[];
  serviceSelection: string;
  onServiceSelectionChange: (value: string) => void;
  onAddServiceSelection: () => void;
  serviceItems: CheckoutItem[];
  onUpdateServiceQuantity: (serviceId: string, quantity: number) => void;
};

const ServiceSection = ({
  services,
  serviceSelection,
  onServiceSelectionChange,
  onAddServiceSelection,
  serviceItems,
  onUpdateServiceQuantity,
}: Props): JSX.Element => (
  <MDBox mt={2}>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormField
          label="Serviço"
          select
          value={serviceSelection}
          onChange={(event: any) => onServiceSelectionChange(event.target.value)}
        >
          <MenuItem value="">Selecione...</MenuItem>
          {services
            .filter((service) => !service.inactive)
            .map((service) => (
              <MenuItem key={service.id} value={service.id}>
                {service.name} — {formatCentsBRL(Number(service.priceCents || 0))}
              </MenuItem>
            ))}
        </FormField>
      </Grid>
      <Grid item xs={12} sm={6} display="flex" alignItems="center">
        <MDButton
          variant="outlined"
          color="info"
          size="small"
          onClick={onAddServiceSelection}
          disabled={!serviceSelection}
          iconOnly
          circular
        >
          +
        </MDButton>
      </Grid>
    </Grid>

    <MDBox mt={2}>
      {serviceItems.length ? (
        <MDBox display="flex" flexDirection="column" gap={1}>
          {serviceItems.map((item) => (
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
                  onClick={() => onUpdateServiceQuantity(item.referenceId || "", item.quantity - 1)}
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
                  onClick={() => onUpdateServiceQuantity(item.referenceId || "", item.quantity + 1)}
                >
                  +
                </MDButton>
                <MDButton
                  variant="text"
                  color="error"
                  size="small"
                  onClick={() => onUpdateServiceQuantity(item.referenceId || "", 0)}
                >
                  Remover
                </MDButton>
              </MDBox>
            </MDBox>
          ))}
        </MDBox>
      ) : (
        <MDTypography variant="body2" color="text">
          Nenhum serviço adicionado.
        </MDTypography>
      )}
    </MDBox>
  </MDBox>
);

export default ServiceSection;
