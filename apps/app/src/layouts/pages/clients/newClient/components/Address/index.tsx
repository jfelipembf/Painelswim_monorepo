/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// NewUser page components
import FormField from "layouts/pages/clients/newClient/components/FormField";

import { useCepLookup } from "hooks/useCepLookup";
import { formatCep } from "utils/cep";

function Address({ formData }: any): JSX.Element {
  const { formField, values, errors, touched, setFieldValue, setFieldTouched } = formData;
  const { zipCode, state, city, neighborhood, address, number } = formField;
  const {
    zipCode: zipCodeV,
    state: stateV,
    city: cityV,
    neighborhood: neighborhoodV,
    address: addressV,
    number: numberV,
  } = values;

  const { address: cepAddress, loading: cepLoading, error: cepError } = useCepLookup(zipCodeV);

  useEffect(() => {
    if (!cepAddress) {
      return;
    }

    if (!stateV) {
      setFieldValue(state.name, cepAddress.state, false);
    }
    if (!cityV) {
      setFieldValue(city.name, cepAddress.city, false);
    }
    if (!neighborhoodV) {
      setFieldValue(neighborhood.name, cepAddress.neighborhood, false);
    }
    if (!addressV) {
      setFieldValue(address.name, cepAddress.address, false);
    }
  }, [
    cepAddress,
    setFieldValue,
    state.name,
    city.name,
    neighborhood.name,
    address.name,
    stateV,
    cityV,
    neighborhoodV,
    addressV,
  ]);

  const handleZipChange = (event: any) => {
    const next = formatCep(event?.target?.value);
    setFieldValue(zipCode.name, next);
  };

  return (
    <MDBox>
      <MDTypography variant="h5" fontWeight="bold">
        Endereço
      </MDTypography>
      <MDBox mt={1.625}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormField
              type={zipCode.type}
              label={zipCode.label}
              name={zipCode.name}
              value={zipCodeV}
              onChange={handleZipChange}
              placeholder={zipCode.placeholder}
              error={errors.zipCode && touched.zipCode}
              success={zipCodeV.length > 0 && !errors.zipCode}
            />
            {cepLoading && (
              <MDTypography variant="caption" color="text">
                Buscando endereco...
              </MDTypography>
            )}
            {!cepLoading && cepError && (
              <MDTypography variant="caption" color="error" fontWeight="medium">
                {cepError}
              </MDTypography>
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormField
              type={state.type}
              label={state.label}
              name={state.name}
              value={stateV}
              placeholder={state.placeholder}
              error={errors.state && touched.state}
              success={stateV.length > 0 && !errors.state}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormField
              type={city.type}
              label={city.label}
              name={city.name}
              value={cityV}
              placeholder={city.placeholder}
              error={errors.city && touched.city}
              success={cityV.length > 0 && !errors.city}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormField
              type={neighborhood.type}
              label={neighborhood.label}
              name={neighborhood.name}
              value={neighborhoodV}
              placeholder={neighborhood.placeholder}
              error={errors.neighborhood && touched.neighborhood}
              success={neighborhoodV.length > 0 && !errors.neighborhood}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              type={address.type}
              label={address.label}
              name={address.name}
              value={addressV}
              placeholder={address.placeholder}
              error={errors.address && touched.address}
              success={addressV.length > 0 && !errors.address}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField
              type={number.type}
              label={number.label}
              name={number.name}
              value={numberV}
              placeholder={number.placeholder}
              error={errors.number && touched.number}
              success={numberV.length > 0 && !errors.number}
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  );
}

export default Address;
