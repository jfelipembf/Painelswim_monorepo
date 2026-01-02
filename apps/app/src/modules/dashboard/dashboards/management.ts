import {
  countMembershipsByStatus,
  fetchMembershipsByStartRange,
  fetchMembershipsByStatus,
  fetchMembershipsByStatusDateRange,
  fetchMembershipsStartedBefore,
  getActiveStudentsCount,
  getDailySummary,
} from "../dashboard.db";
import { fetchAttendanceForSession } from "../../attendance/attendance.db";
import { fetchBranchSessionsInRange } from "../../classes/classes.db";
import { fetchDailySummariesRange } from "../../dailySummaries/dailySummaries.db";
import type { DailySummary } from "../../dailySummaries/dailySummaries.types";

import {
  attendanceTotalFromSummary,
  parseHourIndex,
  toHourIndex,
} from "../aggregations/attendance";
import { buildDistributionChart } from "../utils/chart";
import {
  buildDateKeysRange,
  formatDayLabelPt,
  getMonthRange,
  toDateKey,
  toDateKeyUtc,
  toMonthKey,
} from "../utils/date";

import type { DashboardChartData, ManagementDashboardData } from "../dashboard.types";

const weekdayLabelsPt = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const toDateKeySafe = (value: unknown): string => String(value || "").slice(0, 10);

const toWeekdayIndex = (dateKey: string): number => {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return -1;
  const day = d.getUTCDay();
  return day === 0 ? 6 : day - 1;
};

const isMembershipActiveOn = (membership: any, dateKey: string): boolean => {
  const startKey = toDateKeySafe(membership?.startAt);
  if (!startKey || startKey > dateKey) return false;

  const endKey = toDateKeySafe(membership?.endAt);
  if (endKey && endKey < dateKey) return false;

  const status = String(membership?.status || "");
  if (status === "pending") return false;
  if (status === "canceled" && !endKey) return false;
  if (status === "expired" && !endKey) return false;

  return true;
};

const countActiveClientsAtDate = (memberships: any[], dateKey: string): number => {
  const ids = new Set<string>();
  memberships.forEach((membership) => {
    if (!isMembershipActiveOn(membership, dateKey)) return;
    const clientId = String(membership?.clientId || "");
    if (clientId) ids.add(clientId);
  });
  return ids.size;
};

const countPausedClientsAtDate = (memberships: any[], dateKey: string): number => {
  const ids = new Set<string>();
  memberships.forEach((membership) => {
    if (String(membership?.status || "") !== "paused") return;
    if (!isMembershipActiveOn(membership, dateKey)) return;
    const statusDateKey = toDateKeySafe(membership?.statusDateKey);
    if (statusDateKey && statusDateKey > dateKey) return;
    const clientId = String(membership?.clientId || "");
    if (clientId) ids.add(clientId);
  });
  return ids.size;
};

const sumMembershipSummaryInRange = (
  summaries: DailySummary[],
  startDateKey: string,
  endDateKey: string,
  field: "newCount" | "renewalCount" | "cancellationCount"
): number => {
  if (!Array.isArray(summaries) || summaries.length === 0) return 0;
  const start = toDateKeySafe(startDateKey);
  const end = toDateKeySafe(endDateKey);
  if (!start || !end) return 0;

  return summaries.reduce((acc, summary) => {
    const key = toDateKeySafe(summary?.dateKey || "");
    if (!key || key < start || key > end) return acc;
    const value = Number(summary?.memberships?.[field] || 0);
    return acc + Math.max(0, value);
  }, 0);
};

const countUniqueNewMembershipClients = (memberships: any[]): number => {
  const ids = new Set<string>();
  memberships.forEach((membership) => {
    if (membership?.previousMembershipId) return;
    const clientId = String(membership?.clientId || "");
    if (clientId) ids.add(clientId);
  });
  return ids.size;
};

const countRenewalMemberships = (memberships: any[]): number =>
  memberships.reduce((acc, membership) => acc + (membership?.previousMembershipId ? 1 : 0), 0);

export const getManagementDashboardData = async (
  idTenant: string,
  idBranch: string,
  selectedDate: Date
): Promise<ManagementDashboardData> => {
  if (!idTenant || !idBranch) {
    throw new Error("Tenant e unidade são obrigatórios.");
  }

  const dateKey = toDateKey(selectedDate);
  const monthKey = toMonthKey(selectedDate);
  const { startDateKey } = getMonthRange(selectedDate);
  const monthStartDate = new Date(
    Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1)
  );
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

  const fourMonthStart = new Date(
    Date.UTC(monthStartDate.getUTCFullYear(), monthStartDate.getUTCMonth(), 1)
  );
  fourMonthStart.setUTCMonth(fourMonthStart.getUTCMonth() - 3);
  const fourMonthStartKey = toDateKey(fourMonthStart);
  const fourMonthEndKey = dateKey;

  const [
    activeStudents,
    dailySummary,
    dailySummariesRange,
    suspendedStudents,
    activeMemberships,
    previousMembershipsBase,
  ] = await Promise.all([
    getActiveStudentsCount(idTenant, idBranch),
    getDailySummary(idTenant, idBranch, dateKey),
    fetchDailySummariesRange(idTenant, idBranch, fourMonthStartKey, fourMonthEndKey),
    countMembershipsByStatus(idTenant, idBranch, "paused"),
    fetchMembershipsByStatus(idTenant, idBranch, "active"),
    fetchMembershipsStartedBefore(idTenant, idBranch, previousMonthEndKey),
  ]);

  const summariesRange = dailySummariesRange || [];
  const hasMembershipSummaryInRange = (start: string, end: string): boolean =>
    summariesRange.some((summary) => {
      const key = toDateKeySafe(summary?.dateKey || "");
      if (!key || key < start || key > end) return false;
      return Boolean(summary?.memberships);
    });
  const useMembershipSummaries =
    hasMembershipSummaryInRange(startDateKey, dateKey) &&
    hasMembershipSummaryInRange(previousMonthStartKey, previousMonthEndKey);

  let membershipsInRange: any[] = [];
  let previousMembershipsInRange: any[] = [];
  let canceledMemberships: any[] = [];
  let previousCanceledMemberships: any[] = [];

  if (!useMembershipSummaries) {
    [
      canceledMemberships,
      previousCanceledMemberships,
      membershipsInRange,
      previousMembershipsInRange,
    ] = await Promise.all([
      fetchMembershipsByStatusDateRange(idTenant, idBranch, "canceled", startDateKey, dateKey),
      fetchMembershipsByStatusDateRange(
        idTenant,
        idBranch,
        "canceled",
        previousMonthStartKey,
        previousMonthEndKey
      ),
      fetchMembershipsByStartRange(idTenant, idBranch, startDateKey, dateKey),
      fetchMembershipsByStartRange(idTenant, idBranch, previousMonthStartKey, previousMonthEndKey),
    ]);
  }

  const newStudents = useMembershipSummaries
    ? sumMembershipSummaryInRange(summariesRange, startDateKey, dateKey, "newCount")
    : countUniqueNewMembershipClients(membershipsInRange);

  const previousNewStudents = useMembershipSummaries
    ? sumMembershipSummaryInRange(
        summariesRange,
        previousMonthStartKey,
        previousMonthEndKey,
        "newCount"
      )
    : countUniqueNewMembershipClients(previousMembershipsInRange);

  const renewals = useMembershipSummaries
    ? sumMembershipSummaryInRange(summariesRange, startDateKey, dateKey, "renewalCount")
    : countRenewalMemberships(membershipsInRange);

  const previousRenewals = useMembershipSummaries
    ? sumMembershipSummaryInRange(
        summariesRange,
        previousMonthStartKey,
        previousMonthEndKey,
        "renewalCount"
      )
    : countRenewalMemberships(previousMembershipsInRange);

  const cancellations = useMembershipSummaries
    ? sumMembershipSummaryInRange(summariesRange, startDateKey, dateKey, "cancellationCount")
    : canceledMemberships.length;

  const previousCancellations = useMembershipSummaries
    ? sumMembershipSummaryInRange(
        summariesRange,
        previousMonthStartKey,
        previousMonthEndKey,
        "cancellationCount"
      )
    : previousCanceledMemberships.length;

  const churnPercent = activeStudents ? Math.round((cancellations / activeStudents) * 100) : 0;

  const previousActiveStudents = countActiveClientsAtDate(
    previousMembershipsBase,
    previousMonthEndKey
  );
  const previousSuspendedStudents = countPausedClientsAtDate(
    previousMembershipsBase,
    previousMonthEndKey
  );
  const previousChurnPercent = previousActiveStudents
    ? Math.round((previousCancellations / previousActiveStudents) * 100)
    : 0;

  const summariesByDateKey = new Map<string, DailySummary>();
  (dailySummariesRange || []).forEach((summary) => {
    const key = String(summary?.dateKey || "").slice(0, 10);
    if (key) summariesByDateKey.set(key, summary);
  });

  const selectedSummary = dailySummary || summariesByDateKey.get(dateKey) || null;
  const accessByHourCounts = Array.from({ length: 24 }, () => 0);
  const summaryByHour = selectedSummary?.attendance?.byHour;
  const hasSummaryByHour =
    summaryByHour && typeof summaryByHour === "object" && !Array.isArray(summaryByHour);
  const usedSummaryByHour = Boolean(hasSummaryByHour);

  if (hasSummaryByHour) {
    Object.entries(summaryByHour as Record<string, number>).forEach(([hourKey, value]) => {
      const hour = Number(hourKey);
      const hourIndex = toHourIndex(hour);
      if (hourIndex < 0) return;
      accessByHourCounts[hourIndex] = Math.max(0, Number(value || 0));
    });
  } else {
    const sessionsInDay = await fetchBranchSessionsInRange(idTenant, idBranch, dateKey, dateKey);
    const sessionsForDay = (sessionsInDay || []).filter((session) => session.status !== "canceled");

    if (sessionsForDay.length) {
      const attendanceBySession = await Promise.all(
        sessionsForDay.map(async (session) => ({
          session,
          attendance: await fetchAttendanceForSession(idTenant, idBranch, session.id),
        }))
      );

      attendanceBySession.forEach(({ session, attendance }) => {
        const hourIndex = parseHourIndex(session.startTime);
        if (hourIndex === null) return;
        const presentCount = (attendance || []).filter(
          (entry) => entry.status === "present"
        ).length;
        accessByHourCounts[hourIndex] += presentCount;
      });
    }
  }

  const safeAccessByHourCounts = accessByHourCounts.map((value) => Math.max(0, value));
  const accessTotalForSelectedDay = safeAccessByHourCounts.reduce((acc, v) => acc + v, 0);
  const accessCountFromSummary = attendanceTotalFromSummary(selectedSummary);
  const accessCount = Math.max(accessCountFromSummary, accessTotalForSelectedDay);
  const dailyAccessByDateKey = new Map<string, number>();
  summariesByDateKey.forEach((summary, key) => {
    dailyAccessByDateKey.set(key, attendanceTotalFromSummary(summary));
  });
  const selectedAccess = Math.max(dailyAccessByDateKey.get(dateKey) || 0, accessCount);
  dailyAccessByDateKey.set(dateKey, selectedAccess);

  const weekdayTotals = Array.from({ length: 7 }, () => 0);
  const weekdayCounts = Array.from({ length: 7 }, () => 0);

  dailyAccessByDateKey.forEach((value, dayKey) => {
    const index = toWeekdayIndex(dayKey);
    if (index < 0) return;
    const safeValue = Math.max(0, Number(value || 0));
    weekdayTotals[index] += safeValue;
    weekdayCounts[index] += 1;
  });

  const weekdayAverages = weekdayTotals.map((total, index) => {
    const count = weekdayCounts[index];
    return count ? Number((total / count).toFixed(2)) : 0;
  });
  const selectedWeekdayIndex = toWeekdayIndex(dateKey);
  const weekStartDate = new Date(`${dateKey}T00:00:00.000Z`);
  if (selectedWeekdayIndex >= 0) {
    weekStartDate.setUTCDate(weekStartDate.getUTCDate() - selectedWeekdayIndex);
  }
  const weekStartKey = toDateKey(weekStartDate);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);
  const weekEndKey = toDateKey(weekEndDate);
  const weekDateKeys = buildDateKeysRange(weekStartKey, weekEndKey);
  const actualWeekdayAccess = Array.from({ length: 7 }, () => 0);
  weekDateKeys.forEach((key) => {
    const index = toWeekdayIndex(key);
    if (index < 0) return;
    const value = Math.max(0, Number(dailyAccessByDateKey.get(key) || 0));
    actualWeekdayAccess[index] = value;
  });

  const isToday = toDateKey(new Date()) === dateKey;
  const lastHourIndex = isToday ? toHourIndex(new Date().getHours()) : -1;
  const accessLastHourCount = lastHourIndex >= 0 ? safeAccessByHourCounts[lastHourIndex] : 0;

  const planCounts = new Map<string, { label: string; count: number }>();
  activeMemberships.forEach((membership: any) => {
    const planId = String(membership?.planId || "");
    const planLabel = String(membership?.planName || "Plano");
    if (!planId && !planLabel) return;
    const key = planId || planLabel;
    const current = planCounts.get(key) || { label: planLabel, count: 0 };
    planCounts.set(key, { label: current.label, count: current.count + 1 });
  });

  const activePlansSorted = Array.from(planCounts.values()).sort((a, b) => b.count - a.count);
  const activePlansTop = activePlansSorted.slice(0, 6);
  const activeByPlan = buildDistributionChart("Planos", activePlansTop);

  const cancellationsByDate = new Map<string, number>();
  if (useMembershipSummaries) {
    summariesRange.forEach((summary) => {
      const key = toDateKeySafe(summary?.dateKey || "");
      if (!key || key < startDateKey || key > dateKey) return;
      const value = Math.max(0, Number(summary?.memberships?.cancellationCount || 0));
      cancellationsByDate.set(key, value);
    });
  } else {
    canceledMemberships.forEach((membership: any) => {
      const key = toDateKeyUtc(String(membership?.statusDateKey || ""));
      if (!key) return;
      cancellationsByDate.set(key, (cancellationsByDate.get(key) || 0) + 1);
    });
  }

  const dateKeys = buildDateKeysRange(startDateKey, dateKey);
  const cancellationSeries = dateKeys.map((key) => Math.max(0, cancellationsByDate.get(key) || 0));

  const cancellationsHistory: DashboardChartData["activeStudentsHistory"] = {
    labels: dateKeys.map(formatDayLabelPt),
    datasets: [{ label: "Cancelamentos", data: cancellationSeries, color: "error" as const }],
  };

  const accessByDay: DashboardChartData["activeStudentsHistory"] = {
    labels: weekdayLabelsPt,
    datasets: [
      {
        label: "Acesso do dia (semana selecionada)",
        data: actualWeekdayAccess,
        color: "secondary" as const,
      },
      { label: "Média por dia (últimos 4 meses)", data: weekdayAverages, color: "info" as const },
    ],
  };

  return {
    dateKey,
    monthKey,
    metrics: {
      accessCount,
      accessLastHourCount,
      activeStudents,
      newStudents,
      suspendedStudents,
      cancellations,
      churnPercent,
      renewals,
    },
    previousMetrics: {
      activeStudents: previousActiveStudents,
      newStudents: previousNewStudents,
      suspendedStudents: previousSuspendedStudents,
      cancellations: previousCancellations,
      churnPercent: previousChurnPercent,
      renewals: previousRenewals,
    },
    charts: {
      activeByPlan,
      cancellationsHistory,
      accessByDay,
    },
  };
};
