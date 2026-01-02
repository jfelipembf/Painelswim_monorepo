import { useMemo } from "react";

import MenuItem from "@mui/material/MenuItem";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";
import DataTable from "examples/Tables/DataTable";

import ProfileDetailModal, {
  type ChartData,
} from "layouts/pages/clients/clientProfile/components/Modals/ProfileDetailModal";

import { buildRecentMonthsOptions } from "utils/dateOptions";
import { FormField } from "components";

type Props = {
  open: boolean;
  onClose: () => void;
  month: string;
  onMonthChange: (value: string) => void;
  testId: string;
  onTestChange: (value: string) => void;
};

function TestsModal({
  open,
  onClose,
  month,
  onMonthChange,
  testId,
  onTestChange,
}: Props): JSX.Element {
  const months = useMemo(() => buildRecentMonthsOptions(6), []);

  const tests = useMemo(
    () => [
      { id: "t-50m", name: "50m - menor tempo", metric: "tempo", target: "50m" },
      { id: "t-100m", name: "100m - menor tempo", metric: "tempo", target: "100m" },
      { id: "t-2min", name: "2 min - maior distância", metric: "distância", target: "120s" },
    ],
    []
  );

  const selectedTest = useMemo(
    () => tests.find((t) => t.id === testId) ?? tests[0],
    [tests, testId]
  );

  const headerControls = (
    <FormField
      label="Teste"
      select
      value={testId}
      onChange={(e: any) => onTestChange(String(e?.target?.value || ""))}
      sx={{ minWidth: 240 }}
    >
      {tests.map((t) => (
        <MenuItem key={t.id} value={t.id}>
          {t.name}
        </MenuItem>
      ))}
    </FormField>
  );

  const chart = useMemo<ChartData>(() => {
    const labels =
      month === "2025-12" ? ["Semana 1", "Semana 2", "Semana 3"] : ["Sem 1", "Sem 2", "Sem 3"];

    const seriesByTestAndMonth: Record<string, Record<string, number[]>> = {
      "t-50m": {
        "2025-10": [65, 63, 62],
        "2025-11": [61, 60, 58],
        "2025-12": [60, 59, 58],
      },
      "t-100m": {
        "2025-10": [140, 138, 136],
        "2025-11": [138, 137, 135],
        "2025-12": [137, 135, 134],
      },
      "t-2min": {
        "2025-10": [150, 155, 160],
        "2025-11": [155, 160, 165],
        "2025-12": [160, 165, 172],
      },
    };

    const isTime = selectedTest.metric === "tempo";
    const data = seriesByTestAndMonth[selectedTest.id]?.[month] ?? [];

    return {
      labels,
      datasets: [
        {
          label: isTime ? "Resultado (s)" : "Resultado (m)",
          color: "info",
          data,
        },
      ],
    };
  }, [month, selectedTest]);

  const tableRows = useMemo(() => {
    const rowsByMonth: Record<string, any[]> = {
      "2025-10": [
        {
          name: "50m - menor tempo",
          metric: "tempo",
          result: "62s",
          compare: "—",
        },
        {
          name: "100m - menor tempo",
          metric: "tempo",
          result: "136s",
          compare: "—",
        },
        {
          name: "2 min - maior distância",
          metric: "distância",
          result: "160m",
          compare: "—",
        },
      ],
      "2025-11": [
        {
          name: "50m - menor tempo",
          metric: "tempo",
          result: "58s",
          compare: "Melhorou 4s",
        },
        {
          name: "100m - menor tempo",
          metric: "tempo",
          result: "135s",
          compare: "Melhorou 1s",
        },
        {
          name: "2 min - maior distância",
          metric: "distância",
          result: "165m",
          compare: "Melhorou 5m",
        },
      ],
      "2025-12": [
        {
          name: "50m - menor tempo",
          metric: "tempo",
          result: "58s",
          compare: "Sem mudança",
        },
        {
          name: "100m - menor tempo",
          metric: "tempo",
          result: "134s",
          compare: "Melhorou 1s",
        },
        {
          name: "2 min - maior distância",
          metric: "distância",
          result: "172m",
          compare: "Melhorou 7m",
        },
      ],
    };

    const list = rowsByMonth[month] ?? [];
    const filtered = list.filter((r) => r.name === selectedTest.name);
    const toUse = filtered.length ? filtered : list;

    return toUse.map((r, idx) => ({
      name: (
        <MDTypography variant="button" fontWeight="medium">
          {r.name}
        </MDTypography>
      ),
      metric: (
        <MDBadge
          badgeContent={r.metric}
          color={r.metric === "tempo" ? "info" : "warning"}
          variant="contained"
          container
          size="xs"
        />
      ),
      result: (
        <MDTypography variant="button" fontWeight="medium">
          {r.result}
        </MDTypography>
      ),
      compare: (
        <MDTypography variant="button" color="text" fontWeight="regular">
          {r.compare}
        </MDTypography>
      ),
      _idx: idx,
    }));
  }, [month, selectedTest]);

  const tableColumns = useMemo(
    () => [
      { Header: "nome do teste", accessor: "name", width: "45%" },
      { Header: "tempo/distância", accessor: "metric", align: "center" },
      { Header: "resultado", accessor: "result", align: "center" },
      { Header: "comparativo", accessor: "compare", align: "center" },
    ],
    []
  );

  return (
    <ProfileDetailModal
      open={open}
      onClose={onClose}
      title="Testes"
      subtitle="Comparação por mês e evolução no tempo"
      headerControls={headerControls}
      month={month}
      months={months}
      onMonthChange={onMonthChange}
      chart={chart}
    >
      <MDTypography variant="h6">Resultados</MDTypography>
      <MDBox mt={1}>
        <DataTable
          table={{ columns: tableColumns, rows: tableRows }}
          entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
          showTotalEntries
          canSearch
          labels={{
            entriesPerPage: "registros por página",
            searchPlaceholder: "Pesquisar...",
            totalEntries: (start, end, total) =>
              `Mostrando ${start} até ${end} de ${total} registros`,
          }}
          isSorted
          noEndBorder
        />
      </MDBox>
    </ProfileDetailModal>
  );
}

export default TestsModal;
