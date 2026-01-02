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

import NameCell from "layouts/pages/clients/clientList/components/NameCell";
import type { BirthdayRow } from "layouts/pages/crm/types";
import { buildClientFilterRows, getAge, parseDateParts } from "layouts/pages/crm/utils";

import { STATUS_LABELS } from "constants/status";

type RangeValues = {
  start: number;
  end: number;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toMonthDayValue = (date: Date): number => (date.getMonth() + 1) * 100 + date.getDate();

const buildRange = (dates: Date[]): RangeValues | null => {
  if (!Array.isArray(dates) || dates.length < 2) return null;
  let [startDate, endDate] = dates;
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return null;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;

  if (startDate.getTime() > endDate.getTime()) {
    [startDate, endDate] = [endDate, startDate];
  }

  return {
    start: toMonthDayValue(startDate),
    end: toMonthDayValue(endDate),
  };
};

const formatMonthDay = (parts: { day: number; month: number }): string =>
  `${pad2(parts.day)}/${pad2(parts.month)}`;

const toMonthDayKey = (parts: { day: number; month: number }): number =>
  parts.month * 100 + parts.day;

const isWithinRange = (value: number, range: RangeValues): boolean => {
  if (range.start <= range.end) {
    return value >= range.start && value <= range.end;
  }
  return value >= range.start || value <= range.end;
};

function BirthdaysTab(): JSX.Element {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Date[]>([]);
  const [appliedRange, setAppliedRange] = useState<RangeValues | null>(null);

  const rangeCandidate = useMemo(() => buildRange(period), [period]);
  const hasRange = Boolean(rangeCandidate);
  const enabled = Boolean(appliedRange);

  const { data: clients, loading, error } = useClientsList({ enabled });
  const clientRows = useMemo(() => buildClientFilterRows(clients), [clients]);

  const rowsData = useMemo<BirthdayRow[]>(() => {
    if (!appliedRange) return [];

    const rows: BirthdayRow[] = [];

    for (const client of clientRows) {
      const parts = parseDateParts(client.birthDate);
      if (!parts) continue;

      const dayValue = toMonthDayKey(parts);
      if (!isWithinRange(dayValue, appliedRange)) continue;

      rows.push({
        id: client.id,
        image: client.image,
        name: client.name,
        birthDate: formatMonthDay(parts),
        age: getAge(parts),
        status: client.status,
      });
    }

    return rows;
  }, [appliedRange, clientRows]);

  const columns = useMemo(
    () => [
      {
        Header: "aluno",
        accessor: "name",
        width: "30%",
        Cell: ({ value: [name, data] }: any) => <NameCell image={data.image} name={name} />,
      },
      { Header: "aniversário", accessor: "birthDate", align: "center" },
      { Header: "idade", accessor: "age", align: "center" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      rowsData.map((r) => ({
        name: [r.name, { image: r.image }],
        birthDate: r.birthDate,
        age: r.age ?? "-",
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
            onClick={() => navigate(`/clients/profile/${r.id}`)}
          >
            <Icon>visibility</Icon>
          </MDButton>
        ),
      })),
    [navigate, rowsData]
  );

  const handleSearch = () => {
    if (!rangeCandidate) return;
    setAppliedRange(rangeCandidate);
  };

  return (
    <MDBox>
      <Card>
        <MDBox p={3}>
          <MDTypography variant="h6" fontWeight="medium">
            Aniversariantes
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

export default BirthdaysTab;
