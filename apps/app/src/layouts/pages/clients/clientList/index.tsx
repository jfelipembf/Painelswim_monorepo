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

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

import NameCell from "layouts/pages/clients/clientList/components/NameCell";
import DefaultCell from "layouts/pages/clients/clientList/components/DefaultCell";
import StatusCell from "layouts/pages/clients/clientList/components/StatusCell";
import ActionCell from "layouts/pages/clients/clientList/components/ActionCell";

import team3 from "assets/images/team-3.jpg";

import { useClientsList } from "hooks/clients";

import { CLIENT_STATUS_BADGES } from "constants/status";

function ClientList(): JSX.Element {
  document.title = "Lista de Clientes";
  const [menu, setMenu] = useState(null);
  const navigate = useNavigate();

  const { data: clients, error } = useClientsList();

  const openMenu = (event: any) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const table = useMemo(() => {
    const columns = [
      {
        Header: "nome completo",
        accessor: "name",
        width: "30%",
        Cell: ({ value: [name, data] }: any) => <NameCell image={data.image} name={name} />,
      },
      {
        Header: "id",
        accessor: "id",
        Cell: ({ value }: any) => <DefaultCell value={value} />,
      },
      {
        Header: "telefone",
        accessor: "phone",
        Cell: ({ value }: any) => <DefaultCell value={value} />,
      },
      {
        Header: "status",
        accessor: "status",
        Cell: ({ value }: any) => {
          const badge = (CLIENT_STATUS_BADGES as any)[value] || CLIENT_STATUS_BADGES.lead;
          let icon = "hourglass_empty";
          if (badge.color === "success") {
            icon = "done";
          } else if (badge.color === "error") {
            icon = "close";
          } else if (badge.color === "info") {
            icon = "info";
          }
          return <StatusCell icon={icon} color={badge.color as any} status={badge.label} />;
        },
      },
      {
        Header: "ação",
        accessor: "action",
        Cell: ({ value }: any) => <ActionCell id={value} />,
      },
    ];

    const rows = clients.map((client) => ({
      name: [
        `${client.firstName} ${client.lastName}`.trim(),
        { image: client.photoUrl ? String(client.photoUrl) : undefined },
      ],
      id: client.friendlyId || client.id,
      phone: client.phone || "",
      status: client.status || "pending",
      action: client.id,
    }));

    return { columns, rows };
  }, [clients]);

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
      <MenuItem onClick={closeMenu}>Status: Pendente</MenuItem>
      <Divider sx={{ margin: "0.5rem 0" }} />
      <MenuItem onClick={closeMenu}>
        <MDTypography variant="button" color="error" fontWeight="regular">
          Remover Filtro
        </MDTypography>
      </MenuItem>
    </Menu>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox my={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <MDButton variant="gradient" color="info" onClick={() => navigate("/clients/new")}>
            novo cliente
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
          {error && (
            <MDBox px={3} pt={3}>
              <MDTypography variant="button" color="error" fontWeight="regular">
                {error}
              </MDTypography>
            </MDBox>
          )}
          <DataTable
            table={table}
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
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ClientList;
