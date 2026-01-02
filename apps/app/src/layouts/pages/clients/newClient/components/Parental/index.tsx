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

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// NewUser page components
import FormField from "layouts/pages/clients/newClient/components/FormField";

function Parental({ formData }: any): JSX.Element {
  const { formField, values, errors, touched } = formData;
  const { phone, whatsapp, email, responsibleName, responsiblePhone } = formField;
  const {
    phone: phoneV,
    whatsapp: whatsappV,
    email: emailV,
    responsibleName: responsibleNameV,
    responsiblePhone: responsiblePhoneV,
  } = values;

  return (
    <MDBox>
      <MDTypography variant="h5" fontWeight="bold">
        Contato
      </MDTypography>
      <MDBox mt={1.625}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormField
              type={phone.type}
              label={phone.label}
              name={phone.name}
              value={phoneV}
              placeholder={phone.placeholder}
              error={errors.phone && touched.phone}
              success={phoneV.length > 0 && !errors.phone}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField
              type={whatsapp.type}
              label={whatsapp.label}
              name={whatsapp.name}
              value={whatsappV}
              placeholder={whatsapp.placeholder}
              error={errors.whatsapp && touched.whatsapp}
              success={whatsappV.length > 0 && !errors.whatsapp}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              type={email.type}
              label={email.label}
              name={email.name}
              value={emailV}
              placeholder={email.placeholder}
              error={errors.email && touched.email}
              success={emailV.length > 0 && !errors.email}
            />
          </Grid>
        </Grid>

        <MDBox mt={2}>
          <MDTypography variant="h6" fontWeight="medium">
            Responsável
          </MDTypography>
        </MDBox>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormField
              type={responsibleName.type}
              label={responsibleName.label}
              name={responsibleName.name}
              value={responsibleNameV}
              placeholder={responsibleName.placeholder}
              error={errors.responsibleName && touched.responsibleName}
              success={responsibleNameV.length > 0 && !errors.responsibleName}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField
              type={responsiblePhone.type}
              label={responsiblePhone.label}
              name={responsiblePhone.name}
              value={responsiblePhoneV}
              placeholder={responsiblePhone.placeholder}
              error={errors.responsiblePhone && touched.responsiblePhone}
              success={responsiblePhoneV.length > 0 && !errors.responsiblePhone}
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  );
}

export default Parental;
