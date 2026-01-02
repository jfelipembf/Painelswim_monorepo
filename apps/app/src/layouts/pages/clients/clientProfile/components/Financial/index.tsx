import { Fragment, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import DataTable from "examples/Tables/DataTable";

import FinancialModal from "layouts/pages/clients/clientProfile/components/Modals/FinancialModal";

import { useClientSales } from "hooks/sales";

const formatBRL = (cents: number): string => {
  const value = Math.max(0, Number(cents || 0)) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const toDisplayDate = (isoOrKey?: string | null): string => {
  const k = String(isoOrKey || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return "";
  const [y, m, d] = k.split("-");
  return `${d}/${m}/${y}`;
};

function Financial(): JSX.Element {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { id } = useParams();
  const { data: sales } = useClientSales(id);

  const lastFive = useMemo(() => {
    return (Array.isArray(sales) ? sales : []).slice(0, 5);
  }, [sales]);

  const table = useMemo(() => {
    const columns = [
      {
        Header: "data",
        accessor: "date",
        width: "30%",
        Cell: ({ value }: any) => (
          <MDBox lineHeight={1.125}>
            <MDTypography display="block" variant="button" fontWeight="medium">
              {value || "—"}
            </MDTypography>
          </MDBox>
        ),
      },
      {
        Header: "id",
        accessor: "id",
        width: "20%",
        Cell: ({ value }: any) => (
          <MDTypography variant="caption" fontWeight="regular" color="text">
            {value}
          </MDTypography>
        ),
      },
      {
        Header: "valor",
        accessor: "total",
        width: "25%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" fontWeight="medium">
            {value}
          </MDTypography>
        ),
      },
      {
        Header: "status",
        accessor: "status",
        width: "25%",
        Cell: ({ value }: any) => (
          <MDBox sx={{ display: "flex", justifyContent: "flex-end", pr: 1 }}>
            <MDBadge
              badgeContent={value.label}
              color={value.color}
              variant="contained"
              container
              size="xs"
            />
          </MDBox>
        ),
      },
    ];

    const rows = lastFive.map((sale) => ({
      date: toDisplayDate((sale as any)?.dateKey || (sale as any)?.createdAt),
      id: `#${String(sale.id).slice(-6).toUpperCase()}`,
      total: formatBRL(Number((sale as any)?.netTotalCents || 0)),
      status: {
        label: sale.status === "paid" ? "pago" : "pendente",
        color: sale.status === "paid" ? "success" : "warning",
      },
    }));

    return { columns, rows };
  }, [lastFive]);

  const openDetails = () => setDetailsOpen(true);
  const closeDetails = () => setDetailsOpen(false);

  return (
    <>
      <Card
        id="financial"
        sx={{ display: "flex", flexDirection: "column", maxHeight: 420, overflow: "hidden", mb: 3 }}
      >
        <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5">Financeiro</MDTypography>
          <MDButton variant="outlined" color="info" size="small" onClick={openDetails}>
            Ver Todas
          </MDButton>
        </MDBox>
        <MDBox sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 3 }}>
          {lastFive.length > 0 ? (
            <DataTable
              table={table}
              entriesPerPage={false}
              showTotalEntries={false}
              canSearch={false}
            />
          ) : (
            <MDBox p={3}>
              <MDTypography variant="button" color="text" fontWeight="regular">
                Nenhuma transação encontrada.
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </Card>

      <FinancialModal open={detailsOpen} onClose={closeDetails} />
    </>
  );
}

export default Financial;
