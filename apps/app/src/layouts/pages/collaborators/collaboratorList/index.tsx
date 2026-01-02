import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

import { useAppSelector } from "../../../../redux/hooks";
import { fetchCollaborators, type Collaborator } from "hooks/collaborators";
import { fetchRoles, type Role } from "hooks/roles";
import NameCell from "layouts/pages/collaborators/collaboratorList/components/NameCell";
import ActionCell from "layouts/pages/collaborators/collaboratorList/components/ActionCell";
import StatusCell from "layouts/pages/collaborators/collaboratorList/components/StatusCell";

import team1 from "assets/images/team-1.jpg";

function CollaboratorList(): JSX.Element {
  document.title = "Lista de Colaboradores";
  const [menu, setMenu] = useState(null);
  const navigate = useNavigate();
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const [rowsData, setRowsData] = useState<Collaborator[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openMenu = (event: any) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const renderMenu = (
    <Menu
      anchorEl={menu}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      open={Boolean(menu)}
      onClose={closeMenu}
      keepMounted
    >
      <MenuItem onClick={closeMenu}>Status: Ativo</MenuItem>
      <MenuItem onClick={closeMenu}>Status: Inativo</MenuItem>
      <MenuItem onClick={closeMenu}>Função: Instrutor</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={closeMenu}>
        <MDTypography variant="button" color="error" fontWeight="regular">
          Remover Filtro
        </MDTypography>
      </MenuItem>
    </Menu>
  );

  useEffect(() => {
    if (!idTenant) {
      setRowsData([]);
      setRoles([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([fetchCollaborators(idTenant, idBranch), fetchRoles(idTenant, idBranch)])
      .then(([collaborators, rolesData]) => {
        if (!active) {
          return;
        }
        setRowsData(collaborators);
        setRoles(rolesData);
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Erro ao carregar colaboradores.");
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
  }, [idTenant, idBranch]);

  const roleNameById = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach((role) => {
      map[role.id] = role.name;
    });
    return map;
  }, [roles]);

  const columns = useMemo(
    () => [
      {
        Header: "colaborador",
        accessor: "name",
        width: "45%",
        Cell: ({ value, row }: any) => (
          <NameCell image={row.original.avatar} name={value} email={row.original.email} />
        ),
      },
      {
        Header: "funcao",
        accessor: "role",
        Cell: ({ value }: any) => (
          <MDTypography variant="caption" fontWeight="medium" color="text">
            {value || "Sem cargo"}
          </MDTypography>
        ),
      },
      {
        Header: "status",
        accessor: "status",
        Cell: ({ value }: any) => {
          if (value === "active") {
            return <StatusCell icon="done" color="success" status="Ativo" />;
          }
          if (value === "inactive") {
            return <StatusCell icon="close" color="error" status="Inativo" />;
          }
          return <StatusCell icon="hourglass_empty" color="warning" status="Pausado" />;
        },
      },
      {
        Header: "acao",
        accessor: "id",
        Cell: ({ value }: any) => <ActionCell id={value} />,
      },
    ],
    []
  );

  const rows = useMemo(
    () =>
      rowsData
        .map((collaborator) => {
          const fullName = [collaborator.name, collaborator.lastName].filter(Boolean).join(" ");
          const roleId = idBranch
            ? collaborator.roleByBranch?.[idBranch]
            : Object.values(collaborator.roleByBranch || {})[0];
          const roleName = roleId ? roleNameById[roleId] : "";
          return {
            id: collaborator.id,
            name: fullName || collaborator.email || collaborator.id,
            email: collaborator.email || "",
            role: roleName || "Sem cargo",
            status: collaborator.status || "inactive",
            avatar: collaborator.photoUrl ? String(collaborator.photoUrl) : undefined,
          };
        })
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [rowsData, roleNameById, idBranch]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox my={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <MDButton variant="gradient" color="info" onClick={() => navigate("/collaborators/new")}>
            novo colaborador
          </MDButton>
          <MDBox display="flex">
            <MDButton variant={menu ? "contained" : "outlined"} color="dark" onClick={openMenu}>
              filtros&nbsp;
              <Icon>keyboard_arrow_down</Icon>
            </MDButton>
            {renderMenu}
          </MDBox>
        </MDBox>
        <Card>
          {loading ? (
            <MDBox display="flex" justifyContent="center" py={6}>
              <CircularProgress color="info" />
            </MDBox>
          ) : error ? (
            <MDBox py={2} px={3}>
              <MDTypography variant="button" color="error" fontWeight="medium">
                {error}
              </MDTypography>
            </MDBox>
          ) : (
            <DataTable
              table={{ columns, rows }}
              entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
              showTotalEntries
              canSearch
              labels={{
                entriesPerPage: "registros por página",
                searchPlaceholder: "Pesquisar...",
                totalEntries: (start, end, total) =>
                  `Mostrando ${start} até ${end} de ${total} registros`,
              }}
            />
          )}
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default CollaboratorList;
