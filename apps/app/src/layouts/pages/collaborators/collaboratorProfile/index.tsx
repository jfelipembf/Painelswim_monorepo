import { useCallback, useEffect, useMemo, useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Collaborator Profile components
import Sidenav from "layouts/pages/collaborators/collaboratorProfile/components/Sidenav";
import HeaderCard from "layouts/pages/collaborators/collaboratorProfile/components/HeaderCard";
import BasicInfo from "layouts/pages/collaborators/collaboratorProfile/components/BasicInfo";
import ChangePassword from "layouts/pages/collaborators/collaboratorProfile/components/ChangePassword";
import DeleteAccount from "layouts/pages/collaborators/collaboratorProfile/components/DeleteAccount";

import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../../redux/hooks";
import { fetchCollaboratorById, type Collaborator } from "hooks/collaborators";
import { fetchRoles, type Role } from "hooks/roles";

function CollaboratorProfile(): JSX.Element {
  document.title = "Perfil do Colaborador";
  const { id } = useParams();
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleUpdated = useCallback(
    (updated: Collaborator) => {
      setCollaborator(updated);
    },
    [setCollaborator]
  );

  useEffect(() => {
    if (!idTenant || !id) {
      setCollaborator(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([fetchCollaboratorById(idTenant, idBranch, id), fetchRoles(idTenant, idBranch)])
      .then(([collaboratorData, rolesData]) => {
        if (!active) {
          return;
        }
        setCollaborator(collaboratorData);
        setRoles(rolesData);
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Erro ao carregar colaborador.");
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [idTenant, id]);

  const roleLabel = useMemo(() => {
    if (!collaborator) {
      return "";
    }
    const roleId = idBranch
      ? collaborator.roleByBranch?.[idBranch]
      : Object.values(collaborator.roleByBranch || {})[0];
    const role = roles.find((item) => item.id === roleId);
    return role?.name || "Sem cargo";
  }, [collaborator, roles, idBranch]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={4}>
        {loading && (
          <MDBox mb={3}>
            <MDTypography variant="button" color="text">
              Carregando colaborador...
            </MDTypography>
          </MDBox>
        )}
        {error && (
          <MDBox mb={3}>
            <MDTypography variant="button" color="error" fontWeight="medium">
              {error}
            </MDTypography>
          </MDBox>
        )}
        {!loading && !error && !collaborator && (
          <MDBox mb={3}>
            <MDTypography variant="button" color="text">
              Colaborador nao encontrado.
            </MDTypography>
          </MDBox>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={3}>
            <Sidenav />
          </Grid>
          <Grid item xs={12} lg={9}>
            <MDBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <HeaderCard
                    collaborator={collaborator}
                    roleLabel={roleLabel}
                    idTenant={idTenant}
                    idBranch={idBranch}
                    onUpdated={handleUpdated}
                  />
                </Grid>
                <Grid item xs={12}>
                  <BasicInfo
                    collaborator={collaborator}
                    roleLabel={roleLabel}
                    idTenant={idTenant}
                    onUpdated={handleUpdated}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ChangePassword collaboratorEmail={collaborator?.email} />
                </Grid>
                <Grid item xs={12}>
                  <DeleteAccount />
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

export default CollaboratorProfile;
