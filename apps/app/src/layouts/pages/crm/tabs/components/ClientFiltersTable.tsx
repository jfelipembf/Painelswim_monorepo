import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Icon from "@mui/material/Icon";

import DataTable from "examples/Tables/DataTable";

import NameCell from "layouts/pages/clients/clientList/components/NameCell";
import DefaultCell from "layouts/pages/clients/clientList/components/DefaultCell";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

import type { ClientFilterRow } from "layouts/pages/crm/types";

type Props = {
  members: ClientFilterRow[];
};

function ClientFiltersTable({ members }: Props): JSX.Element {
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        Header: "cliente",
        accessor: "name",
        width: "40%",
        Cell: ({ value: [name, data] }: any) => <NameCell image={data.image} name={name} />,
      },
      { Header: "telefone", accessor: "phone" },
      { Header: "email", accessor: "email" },
      { Header: "ação", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      members.map((m) => ({
        name: [m.name, { image: m.image }],
        phone: <DefaultCell value={m.phone || "-"} />,
        email: <DefaultCell value={m.email || "-"} />,
        actions: (
          <MDBox display="flex" justifyContent="center">
            <MDButton
              variant="outlined"
              color="info"
              size="small"
              iconOnly
              onClick={() => navigate(`/clients/profile/${m.id}`)}
            >
              <Icon>visibility</Icon>
            </MDButton>
          </MDBox>
        ),
      })),
    [members, navigate]
  );

  return (
    <DataTable
      table={{ columns, rows }}
      entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
      showTotalEntries
      canSearch
      labels={{
        entriesPerPage: "registros por página",
        searchPlaceholder: "Pesquisar...",
        totalEntries: (start, end, total) => `Mostrando ${start} até ${end} de ${total} registros`,
      }}
      isSorted
      noEndBorder
    />
  );
}

export default ClientFiltersTable;
