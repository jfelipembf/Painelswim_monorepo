import { useNavigate } from "react-router-dom";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function AccessDenied(): JSX.Element {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        mt={6}
        mb={4}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <MDBox textAlign="center">
          <MDTypography variant="h4" fontWeight="bold" mb={1}>
            Sem permissao
          </MDTypography>
          <MDTypography variant="button" color="text" mb={3} display="block">
            Voce nao tem acesso a esta pagina.
          </MDTypography>
          <MDButton variant="gradient" color="info" onClick={() => navigate(-1)}>
            voltar
          </MDButton>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AccessDenied;
