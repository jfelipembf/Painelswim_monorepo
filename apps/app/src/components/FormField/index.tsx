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

import { useContext } from "react";

// formik components
import { ErrorMessage, Field, FormikContext } from "formik";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";

interface Props {
  label: string;
  name?: string;
  [key: string]: any;
}

function FormField({ label, name, ...rest }: Props): JSX.Element {
  const formik = useContext(FormikContext);
  const hasFormik = Boolean(formik && typeof (formik as any).getFieldProps === "function");

  const shouldShrinkLabel = rest?.type === "date" || rest?.type === "time";
  const nextInputLabelProps = shouldShrinkLabel
    ? { ...(rest.InputLabelProps || {}), shrink: true }
    : rest.InputLabelProps;
  const nextRest = shouldShrinkLabel ? { ...rest, InputLabelProps: nextInputLabelProps } : rest;

  return (
    <MDBox mb={1.5}>
      {name && hasFormik ? (
        <>
          <Field
            {...nextRest}
            name={name}
            as={MDInput}
            variant="standard"
            label={label}
            fullWidth
          />
          <MDBox mt={0.75}>
            <MDTypography component="div" variant="caption" color="error" fontWeight="regular">
              {(<ErrorMessage name={name} />) as any}
            </MDTypography>
          </MDBox>
        </>
      ) : (
        <MDInput {...nextRest} name={name} variant="standard" label={label} fullWidth />
      )}
    </MDBox>
  );
}

export default FormField;
