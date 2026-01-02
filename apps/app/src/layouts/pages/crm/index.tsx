import { useMemo, useState } from "react";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import { BirthdaysTab, ClientFiltersTab, ContractDueTab } from "layouts/pages/crm/tabs";

type CrmTab = "contractDue" | "birthdays" | "clientFilters";

function CRMPage(): JSX.Element {
  document.title = "CRM";

  const [tab, setTab] = useState<CrmTab>("contractDue");
  const tabValue = useMemo(() => {
    if (tab === "contractDue") return 0;
    if (tab === "birthdays") return 1;
    return 2;
  }, [tab]);

  const handleTabChange = (_: unknown, value: number) => {
    setTab(value === 0 ? "contractDue" : value === 1 ? "birthdays" : "clientFilters");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <MDBox mt={1} sx={{ maxWidth: 720 }}>
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
                padding: "6px 10px",
              },
            }}
          >
            <Tab label="Vencimento de contrato" />
            <Tab label="Aniversariantes" />
            <Tab label="Filtro de clientes" />
          </Tabs>
        </MDBox>

        <MDBox mt={3}>
          {tab === "contractDue" ? <ContractDueTab /> : null}
          {tab === "birthdays" ? <BirthdaysTab /> : null}
          {tab === "clientFilters" ? <ClientFiltersTab /> : null}
        </MDBox>
      </MDBox>

      <Footer />
    </DashboardLayout>
  );
}

export default CRMPage;
