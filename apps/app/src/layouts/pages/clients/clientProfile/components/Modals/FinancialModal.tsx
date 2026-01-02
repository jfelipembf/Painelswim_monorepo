import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

import DataTable from "examples/Tables/DataTable";

import { useClientSales, type Sale, type SaleItemType } from "hooks/sales";

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

const typeLabel = (t: SaleItemType): string => {
  if (t === "membership") return "Contrato";
  if (t === "service") return "Serviço";
  return "Produto";
};

type FinancialRow = {
  id: string;
  date: string;
  type: string;
  name: string;
  value: string;
  method: string;
  status: "pago" | "pendente";
};

const buildRowsFromSales = (sales: Sale[]): FinancialRow[] => {
  const list: FinancialRow[] = [];

  (Array.isArray(sales) ? sales : []).forEach((sale) => {
    const saleDate = toDisplayDate((sale as any)?.dateKey);
    const status = sale.status === "paid" ? "pago" : "pendente";
    const firstPayment = Array.isArray((sale as any)?.payments) ? (sale as any).payments[0] : null;
    const method = firstPayment?.method ? String(firstPayment.method).toUpperCase() : "—";

    const items = Array.isArray(sale.items) ? sale.items : [];
    items.forEach((item, idx) => {
      const rowId = `${sale.id}:${idx}`;
      list.push({
        id: rowId,
        date: saleDate || "—",
        type: typeLabel(item.type),
        name: String(item.description || "").trim() || "—",
        value: formatBRL(Number(item.totalCents || 0)),
        method,
        status,
      });
    });
  });

  return list;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function FinancialModal({ open, onClose }: Props): JSX.Element {
  const [menu, setMenu] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState<"pago" | "pendente" | null>(null);

  const { id } = useParams();
  const { data: sales } = useClientSales(id, { enabled: open });

  const openMenu = (event: any) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const items = useMemo(() => buildRowsFromSales(sales), [sales]);

  const filteredItems = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((it: any) => it.status === statusFilter);
  }, [items, statusFilter]);

  const columns = useMemo(
    () => [
      { Header: "#", accessor: "index", width: "6%" },
      { Header: "data", accessor: "date", width: "14%" },
      { Header: "item", accessor: "item", width: "36%" },
      { Header: "valor", accessor: "value", align: "right" },
      { Header: "pagamento", accessor: "method", align: "center" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      filteredItems.map((it: any, idx: number) => {
        const isPending = it.status === "pendente";

        return {
          index: (
            <MDTypography variant="button" fontWeight="medium">
              {idx + 1}
            </MDTypography>
          ),
          date: (
            <MDTypography variant="button" fontWeight="regular" color="text">
              {it.date}
            </MDTypography>
          ),
          item: (
            <MDTypography variant="button" fontWeight="medium">
              {it.type}: {it.name}
            </MDTypography>
          ),
          value: (
            <MDTypography variant="button" fontWeight="medium">
              {it.value}
            </MDTypography>
          ),
          method: (
            <MDTypography variant="button" color="text" fontWeight="regular">
              {it.method}
            </MDTypography>
          ),
          status: (
            <MDBadge
              badgeContent={it.status}
              color={isPending ? "warning" : "success"}
              variant="contained"
              container
              size="xs"
            />
          ),
          actions: isPending ? (
            <MDButton variant="gradient" color="info" size="small">
              Pagar
            </MDButton>
          ) : (
            <MDTypography variant="button" color="text">
              —
            </MDTypography>
          ),
        };
      }),
    [filteredItems]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle>Financeiro</DialogTitle>
      <DialogContent>
        <MDBox pt={1}>
          <MDBox display="flex" justifyContent="flex-end" mb={2}>
            <MDButton variant={menu ? "contained" : "outlined"} color="dark" onClick={openMenu}>
              filtros&nbsp;
              <Icon>keyboard_arrow_down</Icon>
            </MDButton>
            <Menu
              anchorEl={menu}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              open={Boolean(menu)}
              onClose={closeMenu}
              keepMounted
            >
              <MenuItem
                onClick={() => {
                  setStatusFilter("pago");
                  closeMenu();
                }}
              >
                Status: Pago
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setStatusFilter("pendente");
                  closeMenu();
                }}
              >
                Status: Pendente
              </MenuItem>
              <Divider sx={{ margin: "0.5rem 0" }} />
              <MenuItem
                onClick={() => {
                  setStatusFilter(null);
                  closeMenu();
                }}
              >
                <MDTypography variant="button" color="error" fontWeight="regular">
                  Remover Filtro
                </MDTypography>
              </MenuItem>
            </Menu>
          </MDBox>

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
            isSorted
            noEndBorder
          />
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton variant="outlined" color="secondary" onClick={onClose}>
          Fechar
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default FinancialModal;
