import { fetchDailySummariesRange } from "../../dailySummaries/dailySummaries.db";
import { fetchCashMovementsRange } from "../../cashMovements/cashMovements.db";
import { getMonthlySummaries, getSalesRange } from "../dashboard.db";
import type { DashboardChartData, FinancialDashboardData } from "../dashboard.types";
import {
  buildDateKeysRange,
  formatDayLabelPt,
  getMonthRange,
  toDateKey,
  toDateKeyUtc,
  toMonthKey,
} from "../utils/date";

type CashMovementRecord = {
  dateKey?: string;
  type?: string;
  amountCents?: number;
};

const formatMonthLabelPt = (monthKey: string): string => {
  const d = new Date(`${monthKey}-01T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return monthKey;
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(d);
};

const buildRecentMonthKeys = (end: Date, monthsBack: number): string[] => {
  const keys: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    keys.push(toMonthKey(d));
  }
  return keys;
};

const grossSalesCentsFromRecord = (record: any): number => {
  return Number(record?.paidTotalCents ?? record?.sales?.paidTotalCents ?? 0);
};

const netSalesCentsFromRecord = (record: any): number => {
  const netPaid = Number(record?.netPaidTotalCents ?? 0);
  if (netPaid) return netPaid;
  const paid = Number(record?.paidTotalCents ?? record?.sales?.paidTotalCents ?? 0);
  const fees = Number(record?.feesCents ?? record?.sales?.feesCents ?? 0);
  return paid - fees;
};

export const getFinancialDashboardData = async (
  idTenant: string,
  idBranch: string,
  selectedDate: Date
): Promise<FinancialDashboardData> => {
  if (!idTenant || !idBranch) {
    throw new Error("Tenant e unidade são obrigatórios.");
  }

  const dateKey = toDateKey(selectedDate);
  const monthKey = toMonthKey(selectedDate);
  const { startDateKey } = getMonthRange(selectedDate);

  const previousMonthStart = new Date(
    Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() - 1, 1)
  );
  const previousMonthEnd = new Date(
    Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 0)
  );
  const previousMonthEndDay = Math.min(selectedDate.getUTCDate(), previousMonthEnd.getUTCDate());
  const previousMonthEndSameDay = new Date(
    Date.UTC(
      previousMonthStart.getUTCFullYear(),
      previousMonthStart.getUTCMonth(),
      previousMonthEndDay
    )
  );
  const previousMonthStartKey = toDateKey(previousMonthStart);
  const previousMonthEndKey = toDateKey(previousMonthEndSameDay);

  const [dailySummaries, previousDailySummaries, monthlySummaries] = await Promise.all([
    fetchDailySummariesRange(idTenant, idBranch, startDateKey, dateKey),
    fetchDailySummariesRange(idTenant, idBranch, previousMonthStartKey, previousMonthEndKey),
    getMonthlySummaries(idTenant, idBranch),
  ]);

  const dateKeys = buildDateKeysRange(startDateKey, dateKey);
  const summariesByDate = new Map(
    (dailySummaries || []).map((summary) => [toDateKeyUtc(String(summary?.dateKey || "")), summary])
  );

  const shouldFallbackCurrent = (dailySummaries || []).length === 0 && dateKeys.length > 0;
  const shouldFallbackPrevious = (previousDailySummaries || []).length === 0;

  const [salesFallbackCurrent, cashFallbackCurrent, salesFallbackPrevious] = await Promise.all([
    shouldFallbackCurrent
      ? getSalesRange(idTenant, idBranch, startDateKey, dateKey)
      : Promise.resolve([]),
    shouldFallbackCurrent
      ? fetchCashMovementsRange(idTenant, idBranch, startDateKey, dateKey)
      : Promise.resolve([]),
    shouldFallbackPrevious
      ? getSalesRange(idTenant, idBranch, previousMonthStartKey, previousMonthEndKey)
      : Promise.resolve([]),
  ]);

  const fallbackSalesNetByDateKey = new Map<string, number>();
  const fallbackSalesGrossByDateKey = new Map<string, number>();
  (salesFallbackCurrent || [])
    .filter((sale: any) => String(sale?.status || "") !== "canceled")
    .forEach((sale: any) => {
      const key = toDateKeyUtc(String(sale?.dateKey || ""));
      if (!key) return;
      const net = netSalesCentsFromRecord(sale);
      const gross = grossSalesCentsFromRecord(sale);
      fallbackSalesNetByDateKey.set(key, (fallbackSalesNetByDateKey.get(key) || 0) + net);
      fallbackSalesGrossByDateKey.set(key, (fallbackSalesGrossByDateKey.get(key) || 0) + gross);
    });

  const fallbackCashByDateKey = new Map<string, { incomeCents: number; expenseCents: number }>();
  (cashFallbackCurrent || []).forEach((movement: CashMovementRecord) => {
    const key = toDateKeyUtc(String(movement?.dateKey || ""));
    if (!key) return;
    const amount = Number(movement?.amountCents || 0);
    const type = String(movement?.type || "");
    const current = fallbackCashByDateKey.get(key) || { incomeCents: 0, expenseCents: 0 };
    if (type === "income") current.incomeCents += amount;
    if (type === "expense") current.expenseCents += amount;
    fallbackCashByDateKey.set(key, current);
  });

  const expenseSeries = dateKeys.map((key) => {
    const summary = summariesByDate.get(key);
    if (summary) return Number(summary?.cashMovements?.expenseCents || 0) / 100;
    if (shouldFallbackCurrent) {
      const cash = fallbackCashByDateKey.get(key);
      return Number(cash?.expenseCents || 0) / 100;
    }
    return 0;
  });

  const incomeSeries = dateKeys.map((key) => {
    const summary = summariesByDate.get(key);
    if (summary) {
      const salesNet = netSalesCentsFromRecord(summary);
      const cashIncome = Number(summary?.cashMovements?.incomeCents || 0);
      return (salesNet + cashIncome) / 100;
    }
    if (shouldFallbackCurrent) {
      const salesNet = Number(fallbackSalesNetByDateKey.get(key) || 0);
      const cashIncome = Number(fallbackCashByDateKey.get(key)?.incomeCents || 0);
      return (salesNet + cashIncome) / 100;
    }
    return 0;
  });

  const salesMonthToDateCents = dateKeys.reduce((acc, key) => {
    const summary = summariesByDate.get(key);
    if (summary) return acc + grossSalesCentsFromRecord(summary);
    if (shouldFallbackCurrent) return acc + Number(fallbackSalesGrossByDateKey.get(key) || 0);
    return acc;
  }, 0);

  const expensesMonthToDateCents = dateKeys.reduce((acc, key) => {
    const summary = summariesByDate.get(key);
    if (summary) return acc + Number(summary?.cashMovements?.expenseCents || 0);
    if (shouldFallbackCurrent) {
      return acc + Number(fallbackCashByDateKey.get(key)?.expenseCents || 0);
    }
    return acc;
  }, 0);

  const salesTodayCents = grossSalesCentsFromRecord(summariesByDate.get(dateKey));

  const salesPreviousMonthToDateCents = (previousDailySummaries || []).length
    ? (previousDailySummaries || []).reduce(
        (acc, summary) => acc + grossSalesCentsFromRecord(summary),
        0
      )
    : (salesFallbackPrevious || [])
        .filter((sale: any) => String(sale?.status || "") !== "canceled")
        .reduce((acc: number, sale: any) => acc + grossSalesCentsFromRecord(sale), 0);

  const incomeExpenseHistory: DashboardChartData["activeStudentsHistory"] = {
    labels: dateKeys.map(formatDayLabelPt),
    datasets: [
      { label: "Recebimentos", data: incomeSeries, color: "success" as const },
      { label: "Gastos", data: expenseSeries, color: "error" as const },
    ],
  };

  const recentMonthKeys = buildRecentMonthKeys(selectedDate, 12);
  const previousYearMonthKeys = recentMonthKeys.map((key) => {
    const year = Number(key.slice(0, 4) || 0);
    const month = key.slice(4);
    return `${year - 1}${month}`;
  });

  const monthlyByKey = new Map(
    (monthlySummaries || []).map((s: any) => [String(s?.monthKey || ""), s])
  );

  const grossByMonth = recentMonthKeys.map(
    (key) => Number(monthlyByKey.get(key)?.sales?.paidTotalCents || 0) / 100
  );

  const grossByMonthYoY = previousYearMonthKeys.map(
    (key) => Number(monthlyByKey.get(key)?.sales?.paidTotalCents || 0) / 100
  );

  const salesGrossMonthOverMonth: DashboardChartData["activeStudentsHistory"] = {
    labels: recentMonthKeys.map(formatMonthLabelPt),
    datasets: [
      { label: "Vendas (Bruto)", data: grossByMonth, color: "info" as const },
      { label: "Ano anterior", data: grossByMonthYoY, color: "secondary" as const },
    ],
  };

  return {
    dateKey,
    monthKey,
    metrics: {
      salesMonthToDateCents,
      expensesMonthToDateCents,
      salesTodayCents,
      salesPreviousMonthToDateCents,
    },
    charts: {
      incomeExpenseHistory,
      salesGrossMonthOverMonth,
    },
  };
};
