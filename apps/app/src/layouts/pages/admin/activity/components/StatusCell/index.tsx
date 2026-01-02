/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

========================================================
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
// @mui material components
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

interface Props {
  status: "active" | "inactive";
}

function StatusCell({ status }: Props): JSX.Element {
  return (
    <MDBox display="flex" alignItems="center">
      <MDBox mr={1}>
        <MDButton
          variant="outlined"
          color={status === "active" ? "success" : "error"}
          size="small"
          iconOnly
          circular
        >
          <Icon sx={{ fontWeight: "bold" }}>{status === "active" ? "done" : "close"}</Icon>
        </MDButton>
      </MDBox>
      <MDTypography variant="caption" fontWeight="medium" color="text" sx={{ lineHeight: 0 }}>
        {status === "active" ? "Ativo" : "Inativo"}
      </MDTypography>
    </MDBox>
  );
}

export default StatusCell;
