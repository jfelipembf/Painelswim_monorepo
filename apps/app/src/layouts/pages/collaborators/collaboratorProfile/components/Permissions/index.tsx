// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import { useState } from "react";
import Switch from "@mui/material/Switch";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function Permissions(): JSX.Element {
  return (
    <Card id="permissions">
      <MDBox p={3}>
        <MDTypography variant="h5">Permissões de Acesso</MDTypography>
      </MDBox>
      <MDBox pb={3} px={3}>
        <MDBox display="flex" alignItems="center" mb={2}>
          <MDBox width="80%">
            <MDTypography variant="button" fontWeight="regular" color="text">
              Gerenciar Alunos (Criar, Editar, Excluir)
            </MDTypography>
          </MDBox>
          <MDBox width="20%" display="flex" justifyContent="flex-end">
            <Switch defaultChecked />
          </MDBox>
        </MDBox>
        <MDBox display="flex" alignItems="center" mb={2}>
          <MDBox width="80%">
            <MDTypography variant="button" fontWeight="regular" color="text">
              Gerenciar Financeiro
            </MDTypography>
          </MDBox>
          <MDBox width="20%" display="flex" justifyContent="flex-end">
            <Switch />
          </MDBox>
        </MDBox>
        <MDBox display="flex" alignItems="center" mb={2}>
          <MDBox width="80%">
            <MDTypography variant="button" fontWeight="regular" color="text">
              Gerenciar Atividades e Turmas
            </MDTypography>
          </MDBox>
          <MDBox width="20%" display="flex" justifyContent="flex-end">
            <Switch defaultChecked />
          </MDBox>
        </MDBox>
        <MDBox display="flex" alignItems="center">
          <MDBox width="80%">
            <MDTypography variant="button" fontWeight="regular" color="text">
              Acesso a Relatórios
            </MDTypography>
          </MDBox>
          <MDBox width="20%" display="flex" justifyContent="flex-end">
            <Switch defaultChecked />
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default Permissions;
