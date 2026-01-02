import { useMemo, useState } from "react";
import { Fragment } from "react";

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";

import MembershipActionsDialog from "layouts/pages/clients/clientProfile/components/Modals/MembershipActionsDialog";

import { useClientMemberships, type Membership } from "hooks/memberships";
import type { Client } from "hooks/clients";

import { formatDateBr } from "../../utils";

type Props = {
  client: Client | null;
  onRefetch?: () => Promise<void>;
};

const statusLabel = (
  status?: string
): { label: string; color: "success" | "warning" | "error" | "info" } => {
  const s = String(status || "").toLowerCase();
  if (s === "active") return { label: "Ativo", color: "success" };
  if (s === "paused") return { label: "Suspenso", color: "warning" };
  if (s === "pending") return { label: "Pendente", color: "info" };
  if (s === "expired") return { label: "Expirado", color: "error" };
  return { label: "Cancelado", color: "error" };
};

function MembershipStatusCard({ client, onRefetch }: Props): JSX.Element {
  const clientId = String(client?.id || "");
  const { data: memberships, loading, refetch } = useClientMemberships(clientId);

  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const sortedMemberships = useMemo(() => {
    return [...memberships].sort((a, b) =>
      String(b.startAt || "").localeCompare(String(a.startAt || ""))
    );
  }, [memberships]);

  const currentMembership = useMemo(() => {
    if (!sortedMemberships.length) return null;
    const activeId = String(client?.activeMembershipId || "");
    const byActive = activeId
      ? sortedMemberships.find((m) => String(m.id) === activeId)
      : undefined;
    if (byActive) return byActive;
    return (
      sortedMemberships.find((m) =>
        ["active", "paused", "pending"].includes(String(m.status || "").toLowerCase())
      ) || null
    );
  }, [client?.activeMembershipId, sortedMemberships]);

  const historyMemberships = useMemo(() => {
    if (!currentMembership) return sortedMemberships;
    return sortedMemberships.filter((m) => String(m.id) !== String(currentMembership.id));
  }, [currentMembership, sortedMemberships]);

  const currentTable = useMemo(() => {
    if (!currentMembership) return { columns: [], rows: [] };

    const columns = [
      {
        Header: "#",
        accessor: "number",
        width: "10%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" fontWeight="medium">
            {value}
          </MDTypography>
        ),
      },
      {
        Header: "plano",
        accessor: "planName",
        width: "35%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" fontWeight="medium">
            {value || "—"}
          </MDTypography>
        ),
      },
      {
        Header: "início",
        accessor: "startAt",
        width: "20%",
        Cell: ({ value }: any) => (
          <MDTypography variant="caption" color="text">
            {formatDateBr(value) || "—"}
          </MDTypography>
        ),
      },
      {
        Header: "fim",
        accessor: "endAt",
        width: "20%",
        Cell: ({ value }: any) => (
          <MDTypography variant="caption" color="text">
            {formatDateBr(value) || "—"}
          </MDTypography>
        ),
      },
      {
        Header: "status",
        accessor: "status",
        width: "15%",
        Cell: ({ value }: any) => {
          const statusMeta = statusLabel(value);
          return (
            <MDBox sx={{ display: "flex", justifyContent: "flex-end", pr: 1 }}>
              <MDBadge
                badgeContent={statusMeta.label}
                color={statusMeta.color}
                variant="contained"
                container
                size="xs"
              />
            </MDBox>
          );
        },
      },
      {
        Header: "ação",
        accessor: "action",
        width: "10%",
        Cell: ({ value }: any) => (
          <MDButton
            variant="outlined"
            color="info"
            size="small"
            iconOnly
            circular
            onClick={() => handleOpenDetails(value)}
          >
            <Icon fontSize="small">visibility</Icon>
          </MDButton>
        ),
      },
    ];

    const rows = [
      {
        number: 1,
        planName: currentMembership.planName || "—",
        startAt: currentMembership.startAt,
        endAt: currentMembership.endAt,
        status: currentMembership.status || "unknown",
        action: currentMembership,
      },
    ];

    return { columns, rows };
  }, [currentMembership]);

  const historyTable = useMemo(() => {
    const columns = [
      {
        Header: "#",
        accessor: "number",
        width: "10%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" fontWeight="medium">
            {value}
          </MDTypography>
        ),
      },
      {
        Header: "plano",
        accessor: "planName",
        width: "30%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" fontWeight="medium">
            {value || "—"}
          </MDTypography>
        ),
      },
      {
        Header: "início",
        accessor: "startAt",
        width: "20%",
        Cell: ({ value }: any) => (
          <MDTypography variant="caption" color="text">
            {formatDateBr(value) || "—"}
          </MDTypography>
        ),
      },
      {
        Header: "fim",
        accessor: "endAt",
        width: "20%",
        Cell: ({ value }: any) => (
          <MDTypography variant="caption" color="text">
            {formatDateBr(value) || "—"}
          </MDTypography>
        ),
      },
      {
        Header: "status",
        accessor: "status",
        width: "20%",
        Cell: ({ value }: any) => {
          const statusMeta = statusLabel(value);
          return (
            <MDBox sx={{ display: "flex", justifyContent: "flex-end", pr: 1 }}>
              <MDBadge
                badgeContent={statusMeta.label}
                color={statusMeta.color}
                variant="contained"
                container
                size="xs"
              />
            </MDBox>
          );
        },
      },
      {
        Header: "ação",
        accessor: "action",
        width: "10%",
        Cell: ({ value }: any) => (
          <MDButton
            variant="outlined"
            color="info"
            size="small"
            iconOnly
            circular
            onClick={() => handleOpenDetails(value)}
          >
            <Icon fontSize="small">visibility</Icon>
          </MDButton>
        ),
      },
    ];

    const rows = historyMemberships.map((membership, index) => ({
      number: (currentMembership ? 1 : 0) + index + 1,
      planName: membership.planName || "—",
      startAt: membership.startAt,
      endAt: membership.endAt,
      status: membership.status || "unknown",
      action: membership,
    }));

    return { columns, rows };
  }, [historyMemberships, currentMembership]);

  const handleOpenDetails = (membership: Membership) => {
    setSelectedMembership(membership);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedMembership(null);
  };

  const handleUpdated = async () => {
    await refetch();
    if (onRefetch) await onRefetch();
  };

  return (
    <>
      <Card
        id="membership-status"
        sx={{ display: "flex", flexDirection: "column", maxHeight: 420, overflow: "hidden", mb: 3 }}
      >
        <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <MDBox>
            <MDTypography variant="h5">Contratos</MDTypography>
            <MDTypography variant="button" color="text">
              Atual e histórico
            </MDTypography>
          </MDBox>
        </MDBox>
        <Divider />
        <MDBox sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 3 }}>
          {loading ? (
            <MDBox p={3}>
              <MDTypography variant="button" color="text">
                Carregando contratos...
              </MDTypography>
            </MDBox>
          ) : sortedMemberships.length > 0 ? (
            <MDBox display="flex" flexDirection="column" gap={3}>
              {/* Contrato Atual */}
              {currentMembership && (
                <MDBox display="flex" flexDirection="column" gap={1.5}>
                  <MDTypography variant="button" fontWeight="medium" px={3}>
                    Contrato atual
                  </MDTypography>
                  <DataTable
                    table={currentTable}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    canSearch={false}
                  />
                </MDBox>
              )}

              {/* Histórico de Contratos */}
              {historyMemberships.length > 0 && (
                <MDBox display="flex" flexDirection="column" gap={1.5}>
                  <MDTypography variant="button" fontWeight="medium" px={3}>
                    Histórico de contratos
                  </MDTypography>
                  <DataTable
                    table={historyTable}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    canSearch={false}
                  />
                </MDBox>
              )}
            </MDBox>
          ) : (
            <MDBox p={3}>
              <MDTypography variant="button" color="text">
                Nenhum contrato encontrado.
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </Card>

      <MembershipActionsDialog
        open={detailsOpen}
        membership={selectedMembership}
        client={client}
        onClose={handleCloseDetails}
        onUpdated={handleUpdated}
      />
    </>
  );
}

export default MembershipStatusCard;
