import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

import { Portuguese } from "flatpickr/dist/l10n/pt";

import DataTable from "examples/Tables/DataTable";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDDatePicker from "components/MDDatePicker";
import MDBadge from "components/MDBadge";
import MDTypography from "components/MDTypography";

import { useClientsList } from "hooks/clients";
import { useMembershipsByEndRange } from "hooks/memberships";

import NameCell from "layouts/pages/clients/clientList/components/NameCell";
import type { ContractDueRow } from "layouts/pages/crm/types";
import { buildClientFilterRows, parseDateParts, toClientStatus } from "layouts/pages/crm/utils";

import { STATUS_LABELS } from "constants/status";

type DateRange = {
  start: string;
  end: string;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

const buildRange = (dates: Date[]): DateRange | null => {
  if (!Array.isArray(dates) || dates.length < 2) return null;
  const [startDate, endDate] = dates;
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return null;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;

  let startKey = toDateKey(startDate);
  let endKey = toDateKey(endDate);

  if (startKey > endKey) {
    [startKey, endKey] = [endKey, startKey];
  }

  return { start: startKey, end: endKey };
};

const formatDateKey = (value?: string): string => {
  const parts = parseDateParts(value);
  if (!parts) return String(value || "");
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
};

function ContractDueTab(): JSX.Element {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Date[]>([]);
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null);

  const rangeCandidate = useMemo(() => buildRange(period), [period]);
  const hasRange = Boolean(rangeCandidate);
  const enabled = Boolean(appliedRange?.start && appliedRange?.end);

  const {
    data: memberships,
    loading: membershipsLoading,
    error: membershipsError,
  } = useMembershipsByEndRange({
    startDateKey: appliedRange?.start,
    endDateKey: appliedRange?.end,
    enabled,
  });

  const {
    data: clients,
    loading: clientsLoading,
    error: clientsError,
  } = useClientsList({
    enabled,
  });

  const clientRows = useMemo(() => buildClientFilterRows(clients), [clients]);
  const clientMap = useMemo(
    () => new Map(clientRows.map((client) => [client.id, client])),
    [clientRows]
  );

  const rowsData = useMemo<ContractDueRow[]>(() => {
    if (!appliedRange) return [];

    return (Array.isArray(memberships) ? memberships : [])
      .filter((membership) => membership?.endAt)
      .map((membership) => {
        const clientId = String(membership.clientId || "");
        const client = clientMap.get(clientId);

        return {
          id: String(membership.id || ""),
          clientId,
          image: client?.image,
          name: client?.name || "-",
          contract: String(membership.planName || "Plano"),
          dueDate: formatDateKey(String(membership.endAt || "")),
          status: toClientStatus(membership.status),
        };
      });
  }, [appliedRange, clientMap, memberships]);

  const columns = useMemo(
    () => [
      {
        Header: "aluno",
        accessor: "name",
        width: "30%",
        Cell: ({ value: [name, data] }: any) => <NameCell image={data.image} name={name} />,
      },
      { Header: "contrato", accessor: "contract" },
      { Header: "vencimento", accessor: "dueDate", align: "center" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      rowsData.map((r) => ({
        name: [r.name, { image: r.image }],
        contract: r.contract,
        dueDate: r.dueDate,
        status: (
          <MDBadge
            variant="contained"
            color={r.status === "active" ? "success" : r.status === "paused" ? "warning" : "error"}
            badgeContent={STATUS_LABELS[r.status]}
            container
          />
        ),
        actions: (
          <MDButton
            variant="outlined"
            color="info"
            iconOnly
            onClick={() => navigate(`/clients/profile/${r.clientId}`)}
          >
            <Icon>visibility</Icon>
          </MDButton>
        ),
      })),
    [navigate, rowsData]
  );

  const loading = membershipsLoading || clientsLoading;
  const error = membershipsError || clientsError;

  const handleSearch = () => {
    if (!rangeCandidate) return;
    setAppliedRange(rangeCandidate);
  };

  return (
    <MDBox>
      <Card>
        <MDBox p={3}>
          <MDTypography variant="h6" fontWeight="medium">
            Vencimento de contrato
          </MDTypography>

          <MDBox mt={2}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} sm="auto">
                <MDBox sx={{ width: { xs: "100%", sm: 280 } }}>
                  <MDDatePicker
                    value={period}
                    options={{
                      mode: "range",
                      dateFormat: "d/m/Y",
                      locale: Portuguese,
                    }}
                    onChange={(dates: any[]) => {
                      setPeriod(dates || []);
                    }}
                    input={{
                      label: "Período",
                      fullWidth: true,
                      InputLabelProps: { shrink: true },
                    }}
                  />
                </MDBox>
              </Grid>
              <Grid item xs={12} sm="auto">
                <MDButton
                  variant="gradient"
                  color="info"
                  onClick={handleSearch}
                  disabled={!hasRange || loading}
                  sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 140 }}
                >
                  Buscar
                </MDButton>
              </Grid>
            </Grid>
          </MDBox>

          {error ? (
            <MDBox mt={2}>
              <MDTypography variant="button" color="error" fontWeight="regular">
                {error}
              </MDTypography>
            </MDBox>
          ) : null}

          <MDBox mt={3}>
            <DataTable
              table={{ columns, rows }}
              entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
              showTotalEntries
              canSearch
              labels={{
                entriesPerPage: "registros por página",
                searchPlaceholder: "Pesquisar aluno...",
                totalEntries: (start, end, total) =>
                  `Mostrando ${start} até ${end} de ${total} registros`,
              }}
              isSorted
              noEndBorder
            />
          </MDBox>
        </MDBox>
      </Card>
    </MDBox>
  );
}

export default ContractDueTab;
