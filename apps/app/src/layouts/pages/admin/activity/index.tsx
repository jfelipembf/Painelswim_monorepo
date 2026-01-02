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

import Card from "@mui/material/Card";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import ActivityTable from "./components/ActivityTable";
import { useActivityListPage } from "./hooks/useActivityListPage";

import { ConfirmDialog } from "components";

function ActivityList(): JSX.Element {
  const { activities, loading, error, handleDelete, handleNewActivity, confirmDialog } =
    useActivityListPage();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ConfirmDialog
        {...confirmDialog.dialogProps}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
      />
      <MDBox my={3}>
        <MDBox display="flex" justifyContent="flex-end" mb={2}>
          <MDButton variant="gradient" color="info" onClick={handleNewActivity}>
            nova atividade
          </MDButton>
        </MDBox>
        {loading ? (
          <MDBox mb={2}>
            <MDTypography variant="button" color="text" fontWeight="regular">
              Carregando atividades…
            </MDTypography>
          </MDBox>
        ) : null}
        {error ? (
          <MDBox mb={2}>
            <MDTypography variant="button" color="error" fontWeight="medium">
              {error}
            </MDTypography>
          </MDBox>
        ) : null}
        <Card>
          <ActivityTable activities={activities} onDelete={handleDelete} />
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ActivityList;
