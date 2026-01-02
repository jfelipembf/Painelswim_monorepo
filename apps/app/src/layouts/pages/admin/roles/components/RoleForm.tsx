import { useEffect, useMemo, useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { PermissionGroup, RolePermissions } from "hooks/roles";
import { FormField } from "components";

type RoleFormData = {
  name: string;
  description: string;
  permissions: RolePermissions;
};

type Props = {
  saving?: boolean;
  error?: string | null;
  initialData?: Partial<RoleFormData> | null;
  permissionGroups: PermissionGroup[];
  onSubmit: (payload: RoleFormData) => void;
};

const buildEmptyPermissions = (
  permissionGroups: PermissionGroup[],
  initial?: RolePermissions
): RolePermissions => {
  const permissions: RolePermissions = {};
  permissionGroups.forEach((group) => {
    group.permissions.forEach((permission) => {
      permissions[permission.key] = Boolean(initial?.[permission.key]);
    });
  });
  return permissions;
};

function RoleForm({
  saving = false,
  error = null,
  initialData = null,
  permissionGroups,
  onSubmit,
}: Props): JSX.Element {
  const [formState, setFormState] = useState<RoleFormData>({
    name: "",
    description: "",
    permissions: buildEmptyPermissions(permissionGroups),
  });

  const isEditMode = Boolean(initialData?.name);

  const permissionKeys = useMemo(
    () =>
      permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.key)),
    [permissionGroups]
  );

  useEffect(() => {
    setFormState({
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      permissions: buildEmptyPermissions(permissionGroups, initialData?.permissions),
    });
  }, [initialData, permissionGroups, permissionKeys]);

  const handleChange =
    (field: "name" | "description") => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const handleToggle = (key: string) => {
    setFormState((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const handleReset = () => {
    setFormState({
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      permissions: buildEmptyPermissions(permissionGroups, initialData?.permissions),
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      name: formState.name.trim(),
      description: formState.description.trim(),
      permissions: formState.permissions,
    });
  };

  const isSaveDisabled = saving || formState.name.trim().length === 0;

  return (
    <Card sx={{ overflow: "visible" }}>
      <MDBox
        p={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <MDTypography variant="h5">{isEditMode ? "Editar cargo" : "Novo cargo"}</MDTypography>
      </MDBox>

      <form onSubmit={handleSubmit}>
        <MDBox pb={3} px={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Nome"
                value={formState.name}
                onChange={handleChange("name")}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormField
                label="Descricao"
                value={formState.description}
                onChange={handleChange("description")}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <MDTypography variant="h6" fontWeight="medium" mb={2}>
                Permissoes
              </MDTypography>
              <Grid container spacing={2}>
                {permissionGroups.map((group) => (
                  <Grid item xs={12} md={6} key={group.label}>
                    <Card sx={{ height: "100%", p: 2 }}>
                      <MDTypography variant="button" fontWeight="medium">
                        {group.label}
                      </MDTypography>
                      <MDBox mt={2}>
                        {group.permissions.map((permission) => (
                          <MDBox
                            key={permission.key}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            mb={1.5}
                          >
                            <MDTypography variant="button" color="text" fontWeight="regular">
                              {permission.label}
                            </MDTypography>
                            <Switch
                              checked={Boolean(formState.permissions[permission.key])}
                              onChange={() => handleToggle(permission.key)}
                              disabled={saving}
                            />
                          </MDBox>
                        ))}
                      </MDBox>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {error ? (
              <Grid item xs={12}>
                <MDTypography variant="button" color="error" fontWeight="medium">
                  {error}
                </MDTypography>
              </Grid>
            ) : null}

            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="flex-end" gap={2}>
                <MDButton variant="outlined" color="info" disabled={saving} onClick={handleReset}>
                  {isEditMode ? "Desfazer" : "Limpar"}
                </MDButton>
                <MDButton variant="gradient" color="info" type="submit" disabled={isSaveDisabled}>
                  {isEditMode ? "Salvar" : "Criar"}
                </MDButton>
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </form>
    </Card>
  );
}

export default RoleForm;
