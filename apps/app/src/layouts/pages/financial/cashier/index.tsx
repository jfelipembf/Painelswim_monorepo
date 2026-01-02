import { useEffect, useMemo, useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import MDDatePicker from "components/MDDatePicker";

// Material Dashboard 2 PRO React TS examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

import logoSwim from "assets/images/logoSwim.png";

// Cashier Modals
import OpenRegisterModal from "layouts/pages/financial/cashier/components/modals/OpenRegisterModal";
import NewExitModal from "layouts/pages/financial/cashier/components/modals/NewExitModal";

import { useConfirmDialog } from "../../../../hooks/useConfirmDialog";

import { fetchSalesRange } from "hooks/sales";
import { fetchClientById } from "hooks/clients";

import { createCashMovement, fetchCashMovementsRange } from "hooks/cashMovements";
import { useCashierStatus } from "hooks/cashier";

import { useAppSelector } from "../../../../redux/hooks";

import { Portuguese } from "flatpickr/dist/l10n/pt";
import { ConfirmDialog } from "components";
import {
  CASHFLOW_TYPE_BADGES,
  CASHFLOW_TYPE_LABELS,
  CASHFLOW_TYPE_SIGNS,
} from "constants/financial";
import { formatCentsBRL, formatCurrencyBRL } from "utils/currency";

import { CASHIER_TABLE_COLUMNS } from "./constants";
import CashierPrintSection from "./components/print/CashierPrintSection";
import type { CashierRange, CashierRow } from "./types";
import {
  endOfLocalDay,
  formatFirestoreTime,
  formatLocalDateKey,
  isWithinLocalRange,
  startOfLocalDay,
  toUtcDateKey,
} from "./utils";

function CashierPage(): JSX.Element {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);

  const { confirm, dialogProps, handleCancel, handleConfirm } = useConfirmDialog();
  const cashierStatus = useCashierStatus();

  // UI State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [salesRows, setSalesRows] = useState<CashierRow[]>([]);
  const [cashMovementsRows, setCashMovementsRows] = useState<CashierRow[]>([]);
  const [selectedRange, setSelectedRange] = useState<CashierRange>(() => {
    const end = new Date();
    const start = new Date();
    return { start, end };
  });

  // Modals State
  const [showOpenRegisterModal, setShowOpenRegisterModal] = useState(false);
  const [showNewExitModal, setShowNewExitModal] = useState(false);

  const rangeStartLocal = useMemo(
    () => startOfLocalDay(selectedRange.start),
    [selectedRange.start]
  );
  const rangeEndLocal = useMemo(() => endOfLocalDay(selectedRange.end), [selectedRange.end]);
  const startDateKey = useMemo(() => toUtcDateKey(rangeStartLocal), [rangeStartLocal]);
  const endDateKey = useMemo(() => toUtcDateKey(rangeEndLocal), [rangeEndLocal]);
  const printStartLabel = useMemo(() => formatLocalDateKey(rangeStartLocal), [rangeStartLocal]);
  const printEndLabel = useMemo(() => formatLocalDateKey(rangeEndLocal), [rangeEndLocal]);

  // Handlers
  const handleOpenNewExit = () => {
    setShowNewExitModal(true);
  };

  const handleOpenRegister = (_initialValue: number) => {
    setIsRegisterOpen(true);
    setCashMovementsRows([]);
  };

  const handleNewExit = (data: { description: string; value: number; category: string }) => {
    if (idTenant && idBranch) {
      void (async () => {
        await createCashMovement(idTenant, idBranch, {
          type: "expense",
          amountCents: Math.round((Number(data.value || 0) || 0) * 100),
          category: data.category,
          description: data.description,
          dateKey: String(new Date().toISOString()).slice(0, 10),
        });

        const movements = await fetchCashMovementsRange(
          idTenant,
          idBranch,
          startDateKey,
          endDateKey
        );
        const filteredMovements = movements.filter((m: any) =>
          isWithinLocalRange(m.createdAt, rangeStartLocal, rangeEndLocal)
        );
        setCashMovementsRows(
          filteredMovements.map((m: any) => ({
            id: m.id,
            description:
              m.description || CASHFLOW_TYPE_LABELS[m.type === "income" ? "income" : "expense"],
            type: m.type,
            value: Number(m.amountCents || 0) / 100,
            time: formatFirestoreTime(m.createdAt),
          }))
        );
      })();
    }
  };

  const handleCloseRegister = () => {
    void (async () => {
      const ok = await confirm({
        title: "Fechar caixa",
        description: "Deseja realmente fechar o caixa?",
        confirmLabel: "Fechar",
        cancelLabel: "Cancelar",
        confirmColor: "error",
      });
      if (!ok) return;
      setIsRegisterOpen(false);
    })();
  };

  useEffect(() => {
    if (cashierStatus.loading) return;
    setIsRegisterOpen(cashierStatus.isOpen);
  }, [cashierStatus.isOpen, cashierStatus.loading, cashierStatus.storageKey]);

  useEffect(() => {
    if (cashierStatus.loading) return;
    if (!cashierStatus.storageKey) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(cashierStatus.storageKey, String(isRegisterOpen));
  }, [cashierStatus.loading, cashierStatus.storageKey, isRegisterOpen]);

  useEffect(() => {
    const run = async () => {
      if (!idTenant || !idBranch) {
        setSalesRows([]);
        setCashMovementsRows([]);
        return;
      }

      const [list, movements] = await Promise.all([
        fetchSalesRange(idTenant, idBranch, startDateKey, endDateKey),
        fetchCashMovementsRange(idTenant, idBranch, startDateKey, endDateKey),
      ]);

      const filteredSales = list.filter((s: any) =>
        isWithinLocalRange(s.createdAt, rangeStartLocal, rangeEndLocal)
      );
      const filteredMovements = movements.filter((m: any) =>
        isWithinLocalRange(m.createdAt, rangeStartLocal, rangeEndLocal)
      );

      const clientIdsToResolve = Array.from(
        new Set(
          filteredSales
            .map((s: any) => String(s?.clientId || "").trim())
            .filter(Boolean)
            .filter((clientId: string) => {
              const snap = (filteredSales as any[]).find(
                (x) => String(x?.clientId || "") === clientId
              )?.clientSnapshot;
              return !snap?.name;
            })
        )
      );

      const clientById = new Map<string, { name: string; friendlyId?: string }>();
      await Promise.all(
        clientIdsToResolve.map(async (clientId) => {
          const client = await fetchClientById(idTenant, idBranch, clientId);
          if (!client) return;
          const name = `${String(client.firstName || "").trim()} ${String(
            client.lastName || ""
          ).trim()}`.trim();
          clientById.set(clientId, {
            name,
            friendlyId: client.friendlyId ? String(client.friendlyId) : undefined,
          });
        })
      );

      setSalesRows(
        filteredSales.map((s: any) => ({
          id: s.id,
          description: `Venda - ${String(s.items?.[0]?.description || "Contrato")}`,
          clientLabel:
            `${String(s.clientSnapshot?.friendlyId || "").trim()} ${String(
              s.clientSnapshot?.name || ""
            ).trim()}`.trim() ||
            (() => {
              const clientId = String(s.clientId || "");
              const resolved = clientById.get(clientId);
              if (!resolved?.name) return "";
              const friendly = String(resolved.friendlyId || "").trim();
              return `${friendly} ${resolved.name}`.trim();
            })() ||
            String(s.clientId || ""),
          type: "income",
          value: Number(s.netPaidTotalCents ?? s.paidTotalCents ?? 0) / 100,
          time: formatFirestoreTime(s.createdAt),
        }))
      );

      setCashMovementsRows(
        filteredMovements.map((m: any) => ({
          id: m.id,
          description:
            m.description || CASHFLOW_TYPE_LABELS[m.type === "income" ? "income" : "expense"],
          type: m.type,
          value: Number(m.amountCents || 0) / 100,
          time: formatFirestoreTime(m.createdAt),
        }))
      );
    };

    void run();
  }, [endDateKey, idBranch, idTenant, rangeEndLocal, rangeStartLocal, startDateKey]);

  const rows = useMemo(
    () =>
      [...salesRows, ...cashMovementsRows].map((t) => ({
        time: (
          <MDTypography variant="caption" fontWeight="medium">
            {t.time}
          </MDTypography>
        ),
        description: (
          <MDTypography variant="button" fontWeight="regular">
            {t.clientLabel ? `${t.description} — ${String(t.clientLabel)}` : t.description}
          </MDTypography>
        ),
        type: (
          <MDBadge
            variant="outlined"
            badgeContent={CASHFLOW_TYPE_BADGES[t.type].label}
            color={CASHFLOW_TYPE_BADGES[t.type].color}
            size="xs"
            container
          />
        ),
        value: (
          <MDTypography
            variant="button"
            fontWeight="bold"
            color={CASHFLOW_TYPE_BADGES[t.type].color}
          >
            {CASHFLOW_TYPE_SIGNS[t.type]} {formatCurrencyBRL(Number(t.value || 0))}
          </MDTypography>
        ),
      })),
    [cashMovementsRows, salesRows]
  );

  const totalPaidTodayCents =
    Math.round(
      [...salesRows, ...cashMovementsRows].reduce((acc, t) => {
        const v = Math.round(Number(t.value || 0) * 100);
        return t.type === "income" ? acc + v : acc - v;
      }, 0)
    ) || 0;

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  const printIncomeCents = Math.round(
    salesRows.reduce((acc, t) => acc + Math.round(Number(t.value || 0) * 100), 0) || 0
  );
  const printExpenseCents = Math.round(
    cashMovementsRows
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + Math.round(Number(t.value || 0) * 100), 0) || 0
  );
  const printNetCents = printIncomeCents - printExpenseCents;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <CashierPrintSection
        rows={[...salesRows, ...cashMovementsRows]}
        startLabel={printStartLabel}
        endLabel={printEndLabel}
        incomeCents={printIncomeCents}
        expenseCents={printExpenseCents}
        netCents={printNetCents}
        branchLabel={idBranch || undefined}
        logoSrc={logoSwim}
      />

      <MDBox py={3}>
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" fontWeight="bold">
            Caixa Diário
          </MDTypography>
          <MDBox display="flex" gap={2}>
            <MDBox sx={{ width: 170 }}>
              <MDDatePicker
                value={selectedRange?.start ? [selectedRange.start] : []}
                options={{ dateFormat: "d/m/Y", locale: Portuguese }}
                onChange={(dates: any[]) => {
                  const next = dates?.[0];
                  if (next instanceof Date && !Number.isNaN(next.getTime())) {
                    setSelectedRange((prev) => ({ ...prev, start: next }));
                  }
                }}
                input={{ label: "Início", fullWidth: true }}
              />
            </MDBox>
            <MDBox sx={{ width: 170 }}>
              <MDDatePicker
                value={selectedRange?.end ? [selectedRange.end] : []}
                options={{ dateFormat: "d/m/Y", locale: Portuguese }}
                onChange={(dates: any[]) => {
                  const next = dates?.[0];
                  if (next instanceof Date && !Number.isNaN(next.getTime())) {
                    setSelectedRange((prev) => ({ ...prev, end: next }));
                  }
                }}
                input={{ label: "Fim", fullWidth: true }}
              />
            </MDBox>
            <MDButton
              variant="gradient"
              color="info"
              startIcon={<Icon>print</Icon>}
              onClick={handlePrint}
            >
              Imprimir
            </MDButton>
            {isRegisterOpen ? (
              <>
                <MDButton
                  variant="gradient"
                  color="error"
                  startIcon={<Icon>remove</Icon>}
                  onClick={handleOpenNewExit}
                >
                  Nova Saída
                </MDButton>
                <MDButton variant="outlined" color="dark" onClick={handleCloseRegister}>
                  Fechar Caixa
                </MDButton>
              </>
            ) : (
              <MDButton
                variant="gradient"
                color="info"
                onClick={() => setShowOpenRegisterModal(true)}
              >
                Abrir Caixa
              </MDButton>
            )}
          </MDBox>
        </MDBox>

        <Grid container spacing={3}>
          {/* Status Cards */}
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="secondary"
                icon="store"
                title="Status do Caixa"
                count={isRegisterOpen ? "ABERTO" : "FECHADO"}
                percentage={{
                  color: isRegisterOpen ? "success" : "error",
                  amount: "",
                  label: "—",
                }}
              />
            </MDBox>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="secondary"
                icon="account_balance_wallet"
                title="Saldo Atual"
                count={formatCentsBRL(totalPaidTodayCents)}
                percentage={{
                  color: "success",
                  amount: "",
                  label: "hoje",
                }}
              />
            </MDBox>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="secondary"
                icon="receipt_long"
                title="Movimentações"
                count={salesRows.length + cashMovementsRows.length}
                percentage={{
                  color: "secondary",
                  amount: "",
                  label: "transações registradas hoje",
                }}
              />
            </MDBox>
          </Grid>

          {/* Transactions Table */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3} pb={0}>
                <MDTypography variant="h6" fontWeight="medium">
                  Movimentações do Dia
                </MDTypography>
              </MDBox>
              <MDBox p={3}>
                <DataTable
                  table={{ columns: CASHIER_TABLE_COLUMNS, rows }}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                  entriesPerPage={false}
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Modals */}
      <OpenRegisterModal
        open={showOpenRegisterModal}
        onClose={() => setShowOpenRegisterModal(false)}
        onConfirm={handleOpenRegister}
      />
      <NewExitModal
        open={showNewExitModal}
        onClose={() => setShowNewExitModal(false)}
        onConfirm={handleNewExit}
      />

      <ConfirmDialog
        open={dialogProps.open}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmLabel={dialogProps.confirmLabel}
        cancelLabel={dialogProps.cancelLabel}
        confirmColor={dialogProps.confirmColor}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </DashboardLayout>
  );
}

export default CashierPage;
