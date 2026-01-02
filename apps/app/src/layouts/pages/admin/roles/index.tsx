import { useCallback, useEffect, useMemo, useState } from "react";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { useToast } from "context/ToastContext";
import { useAppSelector } from "../../../../redux/hooks";
import {
  createRole,
  deleteRole,
  ensureDefaultRoles,
  fetchRoles,
  updateRole,
  type Role as RoleType,
  type RolePermissions as RolePermissionsType,
} from "hooks/roles";

import RoleForm from "layouts/pages/admin/roles/components/RoleForm";

import { PERMISSION_GROUPS } from "./constants";

const buildPermissionsCount = (permissions?: RolePermissionsType): number =>
  Object.values(permissions ?? {}).filter(Boolean).length;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

function RolesPage(): JSX.Element {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const { showError, showSuccess } = useToast();
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const loadRoles = useCallback(async () => {
    if (!idTenant || !idBranch) {
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      await ensureDefaultRoles(idTenant, idBranch);
      const data = await fetchRoles(idTenant, idBranch);
      setRoles(data);
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error, "Nao foi possivel carregar os cargos."));
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const handleSave = async (payload: {
    name: string;
    description: string;
    permissions: RolePermissionsType;
  }) => {
    if (!idTenant || !idBranch) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (selectedRole?.id) {
        await updateRole(idTenant, idBranch, selectedRole.id, payload);
        showSuccess("Cargo atualizado com sucesso.");
      } else {
        const newId = await createRole(idTenant, idBranch, payload);
        setSelectedRoleId(newId);
        showSuccess("Cargo criado com sucesso.");
      }
      await loadRoles();
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Nao foi possivel salvar o cargo.");
      setSaveError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!idTenant || !idBranch || !roleId) {
      return;
    }
    const confirmed = window.confirm("Deseja excluir este cargo?");
    if (!confirmed) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await deleteRole(idTenant, idBranch, roleId);
      showSuccess("Cargo removido com sucesso.");
      setSelectedRoleId((current) => (current === roleId ? null : current));
      await loadRoles();
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Nao foi possivel remover o cargo.");
      setSaveError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      { Header: "nome", accessor: "name", width: "55%" },
      { Header: "permissoes", accessor: "permissions", align: "center" },
      { Header: "acoes", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      [...roles]
        .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
        .map((role) => ({
          name: (
            <MDTypography variant="button" fontWeight="medium">
              {role?.name || "—"}
            </MDTypography>
          ),
          permissions: (
            <MDTypography variant="button" color="text" fontWeight="medium">
              {buildPermissionsCount(role.permissions)}
            </MDTypography>
          ),
          actions: (
            <MDBox display="flex" justifyContent="center" gap={1}>
              <MDButton
                variant="outlined"
                color="info"
                size="small"
                iconOnly
                circular
                title="Editar"
                onClick={() => setSelectedRoleId(role.id)}
                disabled={saving}
              >
                <Icon fontSize="small">edit</Icon>
              </MDButton>
              <MDButton
                variant="outlined"
                color="error"
                size="small"
                iconOnly
                circular
                title="Excluir"
                onClick={() => handleDelete(role.id)}
                disabled={saving}
              >
                <Icon fontSize="small">delete</Icon>
              </MDButton>
            </MDBox>
          ),
        })),
    [roles, saving, setSelectedRoleId]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <MDBox mb={3} display="flex" justifyContent="flex-end">
          <MDButton
            variant="gradient"
            color="info"
            onClick={() => setSelectedRoleId(null)}
            disabled={saving}
          >
            novo cargo
          </MDButton>
        </MDBox>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ overflow: "visible" }}>
              <MDBox pb={2} px={2} pt={2}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" py={6}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : loadError ? (
                  <MDBox py={2}>
                    <MDTypography variant="button" color="error" fontWeight="medium">
                      {loadError}
                    </MDTypography>
                  </MDBox>
                ) : (
                  <DataTable
                    table={{ columns, rows }}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    isSorted={false}
                    noEndBorder
                  />
                )}
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <RoleForm
              saving={saving}
              error={saveError}
              initialData={selectedRole}
              permissionGroups={PERMISSION_GROUPS}
              onSubmit={handleSave}
            />
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default RolesPage;
