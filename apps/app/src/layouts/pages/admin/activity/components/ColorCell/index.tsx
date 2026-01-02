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

import MDBox from "components/MDBox";

interface Props {
  color: string;
}

function ColorCell({ color }: Props): JSX.Element {
  return (
    <MDBox display="flex" alignItems="center">
      <MDBox
        width="0.9rem"
        height="0.9rem"
        borderRadius="50%"
        sx={{ backgroundColor: color, border: "1px solid rgba(0,0,0,0.15)" }}
      />
    </MDBox>
  );
}

export default ColorCell;
