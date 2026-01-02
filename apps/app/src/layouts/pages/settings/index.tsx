import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import SettingsCompanyTab from "./components/SettingsCompanyTab";
import SettingsFinancialTab from "./components/SettingsFinancialTab";
import SettingsSalesTab from "./components/SettingsSalesTab";
import { useSettingsPage } from "./hooks/useSettingsPage";

function SettingsPage(): JSX.Element {
  const {
    tab,
    tabValue,
    handleTabChange,
    settingsLoading,
    settingsSaving,
    handleSave,
    companyTabProps,
    financialTabProps,
    salesTabProps,
  } = useSettingsPage();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <MDBox sx={{ maxWidth: 720 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                minHeight: "32px",
                "& .MuiTab-root": {
                  fontSize: "0.75rem",
                  minHeight: "32px",
                  padding: "6px 20px",
                },
              }}
            >
              <Tab label="Empresa" />
              <Tab label="Financeiro" />
              <Tab label="Venda" />
            </Tabs>
          </MDBox>
          <MDButton
            variant="gradient"
            color="info"
            size="small"
            onClick={handleSave}
            disabled={settingsLoading || settingsSaving}
          >
            {settingsSaving ? "Salvando..." : "Salvar alterações"}
          </MDButton>
        </MDBox>

        <MDBox mt={3}>
          {tab === "company" ? <SettingsCompanyTab {...companyTabProps} /> : null}
          {tab === "financial" ? <SettingsFinancialTab {...financialTabProps} /> : null}
          {tab === "sales" ? <SettingsSalesTab {...salesTabProps} /> : null}
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SettingsPage;
