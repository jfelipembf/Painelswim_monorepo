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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useField } from "formik";

import FormField from "layouts/pages/clients/newClient/components/FormField";
import { GENDERS, GENDER_LABELS } from "constants/gender";

import team2 from "assets/images/team-2.jpg";
import { AvatarUploadCard } from "components";

function UserInfo({ formData }: any): JSX.Element {
  const { formField, values, errors, touched, photoUploading, onSelectPhoto } = formData;
  const { firstName, lastName, gender, birthDate } = formField;
  const {
    firstName: firstNameV,
    lastName: lastNameV,
    birthDate: birthDateV,
    photoUrl: photoUrlV,
  } = values;

  const [genderField, genderMeta, genderHelpers] = useField(gender.name);

  return (
    <MDBox>
      <MDBox lineHeight={0}>
        <MDTypography variant="h5">Dados pessoais</MDTypography>
        <MDTypography variant="button" color="text">
          Informações principais
        </MDTypography>
      </MDBox>
      <MDBox mt={1.625}>
        <AvatarUploadCard
          imageUrl={photoUrlV || undefined}
          defaultImage={team2}
          loading={Boolean(photoUploading)}
          onSelectFile={(file) =>
            typeof onSelectPhoto === "function" ? onSelectPhoto(file) : undefined
          }
        />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormField
              type={firstName.type}
              label={firstName.label}
              name={firstName.name}
              value={firstNameV}
              placeholder={firstName.placeholder}
              error={errors.firstName && touched.firstName}
              success={firstNameV.length > 0 && !errors.firstName}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField
              type={lastName.type}
              label={lastName.label}
              name={lastName.name}
              value={lastNameV}
              placeholder={lastName.placeholder}
              error={errors.lastName && touched.lastName}
              success={lastNameV.length > 0 && !errors.lastName}
            />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <MDBox mb={1.5}>
              <FormControl
                variant="standard"
                fullWidth
                error={Boolean(genderMeta.touched && genderMeta.error)}
              >
                <InputLabel id="gender-label">{gender.label}</InputLabel>
                <Select
                  labelId="gender-label"
                  value={genderField.value || ""}
                  onChange={(event) => genderHelpers.setValue(event.target.value)}
                  onBlur={() => genderHelpers.setTouched(true)}
                >
                  {GENDERS.map((key) => (
                    <MenuItem key={key} value={key}>
                      {GENDER_LABELS[key]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {genderMeta.touched && genderMeta.error && (
                <MDBox mt={0.75}>
                  <MDTypography
                    component="div"
                    variant="caption"
                    color="error"
                    fontWeight="regular"
                  >
                    {genderMeta.error}
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField
              type={birthDate.type}
              label={birthDate.label}
              name={birthDate.name}
              value={birthDateV}
              placeholder={birthDate.placeholder}
              error={errors.birthDate && touched.birthDate}
              success={birthDateV.length > 0 && !errors.birthDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  );
}

export default UserInfo;
