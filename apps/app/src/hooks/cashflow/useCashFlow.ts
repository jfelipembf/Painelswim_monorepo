import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSelector } from "../../redux/hooks";
import { fetchCashMovementsRange } from "../../modules/cashMovements";
import type { CashMovement } from "../../modules/cashMovements";
import { fetchSalesRange } from "../../modules/sales";
import type { Sale } from "../../modules/sales";

type CashFlowChartPoint = {
  dateKey: string;
  incomeCents: number;
  expenseCents: number;
};

type CashFlowTransaction = {
  id: string;
  dateKey: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amountCents: number;
};

type CashFlowTotals = {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
};

type CashFlowData = {
  startDateKey: string;
  endDateKey: string;
  totals: CashFlowTotals;
  chart: CashFlowChartPoint[];
  transactions: CashFlowTransaction[];
};

const toDateKey = (date: Date): string => String(date.toISOString()).slice(0, 10);

const addDays = (d: Date, days: number): Date => {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const buildDateKeysRange = (startDateKey: string, endDateKey: string): string[] => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateKey) || !/^\d{4}-\d{2}-\d{2}$/.test(endDateKey)) {
    return [];
  }

  const start = new Date(`${startDateKey}T00:00:00.000Z`);
  const end = new Date(`${endDateKey}T00:00:00.000Z`);

  const keys: string[] = [];
  for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    keys.push(toDateKey(d));
  }
  return keys;
};

const saleToTransaction = (sale: Sale): CashFlowTransaction => {
  const amountCents = Math.max(
    0,
    Math.round(Number(sale.netPaidTotalCents ?? sale.paidTotalCents ?? 0))
  );
  const description = `Venda - ${String(sale.items?.[0]?.description || "Contrato")}`;
  const clientName = String((sale as any)?.clientSnapshot?.name || "").trim();
  const clientFriendly = String((sale as any)?.clientSnapshot?.friendlyId || "").trim();

  const suffix = `${clientFriendly} ${clientName}`.trim();
  return {
    id: `sale_${String(sale.id || "")}`,
    dateKey: String(sale.dateKey || "").slice(0, 10),
    description: suffix ? `${description} — ${suffix}` : description,
    category: "Vendas",
    type: "income",
    amountCents,
  };
};

const movementToTransaction = (movement: CashMovement): CashFlowTransaction => ({
  id: `movement_${String(movement.id || "")}`,
  dateKey: String(movement.dateKey || "").slice(0, 10),
  description: String(movement.description || (movement.type === "income" ? "Entrada" : "Saída")),
  category: String(movement.category || ""),
  type: movement.type,
  amountCents: Math.max(0, Math.round(Number(movement.amountCents || 0))),
});

export const useCashFlow = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = addDays(end, -6);
    return { start, end };
  });

  const range = useMemo(
    () => ({
      startDateKey: toDateKey(selectedRange.start),
      endDateKey: toDateKey(selectedRange.end),
    }),
    [selectedRange.end, selectedRange.start]
  );

  const fetchCashFlow = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    setLoading(true);
    setError(null);

    try {
      const [sales, movements] = await Promise.all([
        fetchSalesRange(idTenant, idBranch, range.startDateKey, range.endDateKey),
        fetchCashMovementsRange(idTenant, idBranch, range.startDateKey, range.endDateKey),
      ]);

      const validSales = sales.filter((s) => s?.status !== "canceled");

      const transactions: CashFlowTransaction[] = [
        ...validSales.map(saleToTransaction),
        ...movements.map(movementToTransaction),
      ].filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(String(t.dateKey || "")));

      transactions.sort((a, b) => String(b.dateKey).localeCompare(String(a.dateKey)));

      const dateKeys = buildDateKeysRange(range.startDateKey, range.endDateKey);

      const byDay = new Map<string, { incomeCents: number; expenseCents: number }>();
      dateKeys.forEach((k) => byDay.set(k, { incomeCents: 0, expenseCents: 0 }));

      transactions.forEach((t) => {
        const day = String(t.dateKey || "").slice(0, 10);
        const current = byDay.get(day) || { incomeCents: 0, expenseCents: 0 };
        if (t.type === "income") {
          current.incomeCents += Math.max(0, Number(t.amountCents || 0));
        } else {
          current.expenseCents += Math.max(0, Number(t.amountCents || 0));
        }
        byDay.set(day, current);
      });

      const chart: CashFlowChartPoint[] = dateKeys.map((k) => {
        const row = byDay.get(k) || { incomeCents: 0, expenseCents: 0 };
        return { dateKey: k, incomeCents: row.incomeCents, expenseCents: row.expenseCents };
      });

      const totals = chart.reduce(
        (acc, row) => {
          acc.incomeCents += Math.max(0, Number(row.incomeCents || 0));
          acc.expenseCents += Math.max(0, Number(row.expenseCents || 0));
          return acc;
        },
        { incomeCents: 0, expenseCents: 0, netCents: 0 }
      );
      totals.netCents = totals.incomeCents - totals.expenseCents;

      setData({
        startDateKey: range.startDateKey,
        endDateKey: range.endDateKey,
        totals,
        chart,
        transactions,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar fluxo de caixa");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant, range.endDateKey, range.startDateKey]);

  useEffect(() => {
    fetchCashFlow();
  }, [fetchCashFlow]);

  return {
    data,
    loading,
    error,
    range,
    selectedRange,
    setSelectedRange,
    refetch: fetchCashFlow,
  };
};
