import { useMemo, useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";
import DataTable from "examples/Tables/DataTable";

import TestsModal from "layouts/pages/clients/clientProfile/components/Modals/TestsModal";

type TestType = "distance" | "time";

type TestResult = {
  id: string;
  name: string;
  type: TestType;
  date: string;
  fixedDistanceMeters?: number;
  fixedTimeSeconds?: number;
  resultTimeSeconds?: number;
  resultDistanceMeters?: number;
};

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function Tests(): JSX.Element {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [month, setMonth] = useState("2025-12");
  const [testId, setTestId] = useState("t-50m");

  const openDetails = () => setDetailsOpen(true);
  const closeDetails = () => setDetailsOpen(false);

  const results = useMemo<TestResult[]>(
    () => [
      {
        id: "r1",
        name: "50m - menor tempo",
        type: "distance",
        date: "10/10/2025",
        fixedDistanceMeters: 50,
        resultTimeSeconds: 62,
      },
      {
        id: "r2",
        name: "50m - menor tempo",
        type: "distance",
        date: "10/11/2025",
        fixedDistanceMeters: 50,
        resultTimeSeconds: 58,
      },
      {
        id: "r3",
        name: "2 min - maior distância",
        type: "time",
        date: "01/12/2025",
        fixedTimeSeconds: 120,
        resultDistanceMeters: 165,
      },
    ],
    []
  );

  const comparisonText = useMemo(() => {
    const r1 = results[0];
    const r2 = results[1];
    if (!r1 || !r2) return "—";

    if (r1.type === "distance" && r2.type === "distance") {
      const t1 = Number(r1.resultTimeSeconds || 0);
      const t2 = Number(r2.resultTimeSeconds || 0);
      if (!t1 || !t2) return "—";
      const diff = t1 - t2;
      return diff > 0
        ? `Melhorou ${diff}s`
        : diff < 0
        ? `Piorou ${Math.abs(diff)}s`
        : "Sem mudança";
    }

    if (r1.type === "time" && r2.type === "time") {
      const d1 = Number(r1.resultDistanceMeters || 0);
      const d2 = Number(r2.resultDistanceMeters || 0);
      if (!d1 || !d2) return "—";
      const diff = d2 - d1;
      return diff > 0
        ? `Melhorou ${diff}m`
        : diff < 0
        ? `Piorou ${Math.abs(diff)}m`
        : "Sem mudança";
    }

    return "Comparação disponível quando o mesmo teste é repetido.";
  }, [results]);

  const table = useMemo(() => {
    const columns = [
      {
        Header: "teste",
        accessor: "name",
        width: "35%",
        Cell: ({ row }: any) => (
          <MDBox>
            <MDTypography variant="button" fontWeight="medium">
              {row.original.name}
            </MDTypography>
            <MDTypography variant="caption" color="text" display="block">
              {row.original.date}
            </MDTypography>
          </MDBox>
        ),
      },
      {
        Header: "tipo",
        accessor: "type",
        width: "25%",
        Cell: ({ row }: any) => (
          <MDBox display="flex" justifyContent="flex-end" width="100%">
            <MDBadge
              badgeContent={
                row.original.type === "distance"
                  ? `${row.original.fixedDistanceMeters || 0}m`
                  : formatSeconds(row.original.fixedTimeSeconds || 0)
              }
              color="info"
              variant="contained"
              container
              size="xs"
            />
          </MDBox>
        ),
      },
      {
        Header: "resultado",
        accessor: "result",
        width: "25%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" fontWeight="medium">
            {value}
          </MDTypography>
        ),
      },
      {
        Header: "ação",
        accessor: "action",
        width: "15%",
        Cell: () => (
          <MDButton variant="outlined" color="dark" size="small" iconOnly onClick={openDetails}>
            <Icon>visibility</Icon>
          </MDButton>
        ),
      },
    ];

    const rows = results.map((r) => ({
      name: r.name,
      type: r.type,
      result:
        r.type === "distance"
          ? formatSeconds(r.resultTimeSeconds || 0)
          : `${r.resultDistanceMeters || 0}m`,
      date: r.date,
      fixedDistanceMeters: r.fixedDistanceMeters,
      fixedTimeSeconds: r.fixedTimeSeconds,
      resultTimeSeconds: r.resultTimeSeconds,
      resultDistanceMeters: r.resultDistanceMeters,
      action: r,
    }));

    return { columns, rows };
  }, [results]);

  return (
    <>
      <Card
        id="tests"
        sx={{ display: "flex", flexDirection: "column", maxHeight: 420, overflow: "hidden", mb: 3 }}
      >
        <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5">Testes</MDTypography>
          <MDButton variant="outlined" color="info" size="small" onClick={openDetails}>
            Ver todos
          </MDButton>
        </MDBox>

        <MDBox sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 3 }}>
          <MDBox px={3} pb={2} pt={0}>
            <MDBox display="flex" alignItems="center" gap={1}>
              <Icon fontSize="small">compare</Icon>
              <MDTypography variant="button" fontWeight="medium" color="text">
                Comparação: {comparisonText}
              </MDTypography>
            </MDBox>
          </MDBox>

          <Divider />

          <DataTable
            table={table}
            entriesPerPage={false}
            showTotalEntries={false}
            canSearch={false}
          />
        </MDBox>
      </Card>

      <TestsModal
        open={detailsOpen}
        onClose={closeDetails}
        month={month}
        onMonthChange={setMonth}
        testId={testId}
        onTestChange={setTestId}
      />
    </>
  );
}

export default Tests;
