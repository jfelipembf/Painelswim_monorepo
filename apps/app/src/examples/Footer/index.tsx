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
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Assets
import IntelitecLogo from "assets/images/Logo_inteli.png";

const CURRENT_YEAR = new Date().getFullYear();

function Footer(): JSX.Element {
  return (
    <MDBox component="footer" width="100%" mt={4}>
      <MDBox
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
        px={{ xs: 2, lg: 6 }}
        py={2}
      >
        <MDBox display="flex" alignItems="center" gap={2}>
          <MDBox
            component="img"
            src={IntelitecLogo}
            alt="Intelitec"
            sx={({ functions: { pxToRem } }) => ({
              height: pxToRem(32),
              width: "auto",
              objectFit: "contain",
            })}
          />
          <MDBox lineHeight={1.1}>
            <MDTypography variant="button" color="text" fontWeight="bold" display="block">
              Intelitec Tecnologia
            </MDTypography>
            <MDTypography variant="caption" color="text" display="block" mt={0.25}>
              Produto oficial Intelitec
            </MDTypography>
          </MDBox>
        </MDBox>

        <MDBox textAlign={{ xs: "left", sm: "right" }} lineHeight={1.3}>
          <MDTypography variant="button" color="text">
            CNPJ 60.180.850/0001-40
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block">
            © {CURRENT_YEAR} Intelitec Tecnologia. Todos os direitos reservados.
          </MDTypography>
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default Footer;
