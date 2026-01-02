// @mui material components
import Card from "@mui/material/Card";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

function DeleteAccount(): JSX.Element {
  return (
    <Card id="delete">
      <MDBox
        p={3}
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
      >
        <MDBox mb={1} lineHeight={1}>
          <MDTypography variant="h5">Excluir Colaborador</MDTypography>
          <MDTypography variant="button" color="text">
            Ao excluir este colaborador, o acesso será revogado imediatamente.
          </MDTypography>
        </MDBox>
        <MDBox display="flex" flexDirection={{ xs: "column", sm: "row" }}>
          <MDButton variant="outlined" color="secondary">
            desativar
          </MDButton>
          <MDBox ml={{ xs: 0, sm: 1 }} mt={{ xs: 1, sm: 0 }}>
            <MDButton variant="gradient" color="error" sx={{ height: "100%" }}>
              excluir
            </MDButton>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default DeleteAccount;
