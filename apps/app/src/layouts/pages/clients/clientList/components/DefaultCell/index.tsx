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

// Material Dashboard 2 PRO React TS components
import MDTypography from "components/MDTypography";

// Declaring props types for DefaultCell
interface Props {
  value: string;
}

function DefaultCell({ value }: Props): JSX.Element {
  return (
    <MDTypography variant="caption" fontWeight="medium" color="text">
      {value}
    </MDTypography>
  );
}

export default DefaultCell;
