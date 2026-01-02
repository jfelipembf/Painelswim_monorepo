/* eslint-disable react/prop-types */
// CollaboratorList page components
import NameCell from "layouts/pages/collaborators/collaboratorList/components/NameCell";
import ActionCell from "layouts/pages/collaborators/collaboratorList/components/ActionCell";
import StatusCell from "layouts/pages/collaborators/collaboratorList/components/StatusCell";
import MDTypography from "components/MDTypography";

// Images
import team1 from "assets/images/team-1.jpg";
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";
import team5 from "assets/images/team-5.jpg";

const dataTableData = {
  columns: [
    {
      Header: "colaborador",
      accessor: "name",
      width: "45%",
      Cell: ({ value, row }: any) => (
        <NameCell image={row.original.avatar} name={value} email={row.original.email} />
      ),
    },
    {
      Header: "função",
      accessor: "role",
      Cell: ({ value }: any) => {
        let label = value;
        if (value === "admin") label = "Administrador";
        if (value === "instructor") label = "Instrutor";
        if (value === "coordinator") label = "Coordenador";
        if (value === "staff") label = "Staff";

        return (
          <MDTypography variant="caption" fontWeight="medium" color="text">
            {label}
          </MDTypography>
        );
      },
    },
    {
      Header: "status",
      accessor: "status",
      Cell: ({ value }: any) => {
        let status;

        if (value === "active") {
          status = <StatusCell icon="done" color="success" status="Ativo" />;
        } else if (value === "inactive") {
          status = <StatusCell icon="close" color="error" status="Inativo" />;
        } else {
          status = <StatusCell icon="hourglass_empty" color="warning" status="Pausado" />;
        }

        return status;
      },
    },
    {
      Header: "ação",
      accessor: "id",
      Cell: ({ value }: any) => <ActionCell id={value} />,
    },
  ],

  rows: [
    {
      id: "1",
      name: "Felipe Macedo",
      email: "felipe@painelswim.com",
      role: "admin",
      status: "active",
      avatar: team1,
    },
    {
      id: "2",
      name: "João Silva",
      email: "joao@painelswim.com",
      role: "instructor",
      status: "active",
      avatar: team2,
    },
    {
      id: "3",
      name: "Maria Souza",
      email: "maria@painelswim.com",
      role: "coordinator",
      status: "paused",
      avatar: team3,
    },
    {
      id: "4",
      name: "Ana Costa",
      email: "ana@painelswim.com",
      role: "staff",
      status: "active",
      avatar: team4,
    },
    {
      id: "5",
      name: "Carlos Santos",
      email: "carlos@painelswim.com",
      role: "instructor",
      status: "inactive",
      avatar: team5,
    },
    {
      id: "6",
      name: "Patrícia Lima",
      email: "patricia@painelswim.com",
      role: "coordinator",
      status: "active",
      avatar: team1,
    },
    {
      id: "7",
      name: "Roberto Alves",
      email: "roberto@painelswim.com",
      role: "staff",
      status: "active",
      avatar: team2,
    },
    {
      id: "8",
      name: "Fernanda Oliveira",
      email: "fernanda@painelswim.com",
      role: "instructor",
      status: "paused",
      avatar: team3,
    },
  ],
};

export default dataTableData;
