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

import { useNavigate, useParams } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDAlert from "components/MDAlert";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Client Profile components
import Sidenav from "layouts/pages/clients/clientProfile/components/Sidenav";
import HeaderCard from "layouts/pages/clients/clientProfile/components/HeaderCard";
import ProfileInfoCard from "layouts/pages/clients/clientProfile/components/ProfileInfoCard";
import MembershipStatusCard from "layouts/pages/clients/clientProfile/components/MembershipStatusCard";
import Enrollments from "layouts/pages/clients/clientProfile/components/Enrollments";
import Financial from "layouts/pages/clients/clientProfile/components/Financial";
import Tests from "layouts/pages/clients/clientProfile/components/Tests";
import Evaluations from "layouts/pages/clients/clientProfile/components/Evaluations";

import { useClient } from "hooks/clients";
import { useClientReceivables } from "hooks/receivables";

function ClientProfile(): JSX.Element {
  document.title = "Perfil do Cliente";

  const { id } = useParams();
  const { data: client, refetch: refetchClient } = useClient(id);

  const navigate = useNavigate();

  const { data: receivables } = useClientReceivables(id, {
    statuses: ["pending", "overdue"],
  });

  const debtCents = (Array.isArray(receivables) ? receivables : [])
    .filter((receivable) => String(receivable.kind || "manual") === "manual")
    .reduce((acc, receivable) => {
      const open = Math.max(
        0,
        Number(receivable.amountCents || 0) - Number(receivable.amountPaidCents || 0)
      );
      return acc + open;
    }, 0);
  const debtLabel = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(debtCents / 100);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={3}>
            <Sidenav />
          </Grid>
          <Grid item xs={12} lg={9}>
            <MDBox mb={3}>
              <Grid container spacing={3}>
                {debtCents > 0 && id ? (
                  <Grid item xs={12}>
                    <MDAlert
                      color="warning"
                      sx={{
                        display: "block",
                        "& > div:first-of-type": {
                          width: "100%",
                          p: 0,
                          m: 0,
                        },
                      }}
                    >
                      <MDBox
                        display="flex"
                        flexDirection={{ xs: "column", md: "row" }}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        justifyContent="space-between"
                        width="100%"
                        gap={1.5}
                      >
                        <MDTypography
                          variant="button"
                          fontWeight="medium"
                          color="white"
                          sx={{ flex: 1 }}
                        >
                          Há um saldo devedor de {debtLabel}.
                        </MDTypography>
                        <MDButton
                          sx={{
                            width: { xs: "100%", md: "auto" },
                            ml: { xs: 0, md: "auto" },
                          }}
                          variant="contained"
                          color="dark"
                          size="small"
                          onClick={() => navigate(`/sales/settle-debt/${id}`)}
                        >
                          Quitar
                        </MDButton>
                      </MDBox>
                    </MDAlert>
                  </Grid>
                ) : null}
                <Grid item xs={12}>
                  <HeaderCard client={client} onRefetch={refetchClient} />
                </Grid>
                <Grid item xs={12}>
                  <ProfileInfoCard client={client} onRefetch={refetchClient} />
                </Grid>
                <Grid item xs={12}>
                  <MembershipStatusCard client={client} onRefetch={refetchClient} />
                </Grid>
                <Grid item xs={12}>
                  <Enrollments clientId={id} />
                </Grid>
                <Grid item xs={12}>
                  <Financial />
                </Grid>
                <Grid item xs={12}>
                  <Tests />
                </Grid>
                <Grid item xs={12}>
                  <Evaluations />
                </Grid>
              </Grid>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ClientProfile;
