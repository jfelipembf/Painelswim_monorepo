import {
  getActiveStudentsCount,
  getAvailableContracts,
  getMonthlySummaries,
  getMonthlySummary,
  getSalesRange,
} from "../dashboard.db";
import { fetchDailySummariesRange } from "../../dailySummaries/dailySummaries.db";
import type { DashboardChartData, DashboardData } from "../dashboard.types";
import {
  countUniqueClients,
  filterMembershipSales,
  sumPaidTotalCents,
} from "../aggregations/sales";
import { buildDistributionChart } from "../utils/chart";
import {
  buildYearMonthKeys,
  getMonthRange,
  monthLabelsPt,
  toDateKey,
  toMonthKey,
} from "../utils/date";

export const getDashboardData = async (
  idTenant: string,
  idBranch: string,
  selectedDate: Date
): Promise<DashboardData> => {
  if (!idTenant || !idBranch) {
    throw new Error("Tenant e unidade são obrigatórios.");
  }

  const dateKey = toDateKey(selectedDate);
  const monthKey = toMonthKey(selectedDate);
  const { startDateKey, endDateKey } = getMonthRange(selectedDate);
  const todayKey = toDateKey(new Date());
  const shouldUseDailySummaries = dateKey !== todayKey && dateKey !== endDateKey;

  const [activeStudents, summary, contracts, salesInMonth, summariesAll, dailySummaries] =
    await Promise.all([
      getActiveStudentsCount(idTenant, idBranch),
      getMonthlySummary(idTenant, idBranch, monthKey),
      getAvailableContracts(idTenant, idBranch),
      getSalesRange(idTenant, idBranch, startDateKey, dateKey),
      getMonthlySummaries(idTenant, idBranch),
      shouldUseDailySummaries
        ? fetchDailySummariesRange(idTenant, idBranch, startDateKey, dateKey)
        : Promise.resolve([]),
    ]);

  const activeSales = (salesInMonth || []).filter((sale) => sale.status !== "canceled");
  const membershipSales = filterMembershipSales(activeSales);
  const newClients = countUniqueClients(membershipSales);

  const fallbackSalesCents =
    typeof summary?.sales?.paidTotalCents === "number"
      ? summary.sales.paidTotalCents
      : sumPaidTotalCents(activeSales);
  const totalSalesCents = shouldUseDailySummaries
    ? (dailySummaries || []).reduce((acc, s) => acc + Number(s?.sales?.paidTotalCents || 0), 0)
    : fallbackSalesCents;

  const fallbackExpensesCents =
    typeof summary?.cashMovements?.expenseCents === "number"
      ? summary.cashMovements.expenseCents
      : 0;
  const totalExpensesCents = shouldUseDailySummaries
    ? (dailySummaries || []).reduce(
        (acc, s) => acc + Number(s?.cashMovements?.expenseCents || 0),
        0
      )
    : fallbackExpensesCents;

  const contractById = new Map(contracts.map((c) => [String(c.id || ""), c]));

  const planCounts = new Map<string, { label: string; count: number }>();
  membershipSales.forEach((sale) => {
    sale.items
      .filter((item) => item?.type === "membership")
      .forEach((item) => {
        const planId = String(item.planId || "");
        if (!planId) return;
        const contract = contractById.get(planId);
        if (!contract) return;

        const current = planCounts.get(planId) || {
          label: String(contract.name || "Plano"),
          count: 0,
        };
        const qty = Math.max(1, Number(item.quantity || 1));
        planCounts.set(planId, { ...current, count: current.count + qty });
      });
  });

  const topPlansSorted = Array.from(planCounts.values()).sort((a, b) => b.count - a.count);
  const topPlans = topPlansSorted.slice(0, 6);

  const contractsDistribution = buildDistributionChart("Contratos", topPlans);

  const currentYear = selectedDate.getUTCFullYear();
  const previousYear = currentYear - 1;

  const summariesByMonthKey = new Map<string, { salesCount: number }>();
  summariesAll.forEach((summaryItem) => {
    summariesByMonthKey.set(String(summaryItem.monthKey || ""), {
      salesCount: Math.max(0, Number(summaryItem.sales?.count || 0)),
    });
  });

  const currentYearKeys = buildYearMonthKeys(currentYear);
  const prevYearKeys = buildYearMonthKeys(previousYear);

  const currentYearData = currentYearKeys.map(
    (key) => summariesByMonthKey.get(key)?.salesCount || 0
  );
  const prevYearData = prevYearKeys.map((key) => summariesByMonthKey.get(key)?.salesCount || 0);
  const hasPrevYearData = prevYearData.some((value) => value > 0);

  const activeStudentsHistory: DashboardChartData["activeStudentsHistory"] = {
    labels: monthLabelsPt,
    datasets: [
      { label: String(currentYear), data: currentYearData, color: "info" as const },
      ...(hasPrevYearData
        ? [{ label: String(previousYear), data: prevYearData, color: "secondary" as const }]
        : []),
    ],
  };

  return {
    monthKey,
    metrics: {
      activeStudents,
      newClients,
      totalSalesCents,
      totalExpensesCents,
    },
    charts: {
      activeStudentsHistory,
      contractsDistribution,
    },
  };
};
