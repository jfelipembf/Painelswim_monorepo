import type { DailySummary } from "../../dailySummaries/dailySummaries.types";

const attendanceTotalFromSummary = (summary?: DailySummary | null): number => {
  if (!summary?.attendance) return 0;
  const presentCount = Number(summary.attendance.presentCount);
  const byHour = summary.attendance.byHour;
  const byHourTotal =
    byHour && typeof byHour === "object"
      ? Object.values(byHour as Record<string, number>).reduce(
          (acc, value) => acc + Math.max(0, Number(value || 0)),
          0
        )
      : 0;

  if (Number.isFinite(presentCount) && presentCount > 0) return Math.max(0, presentCount);
  if (byHourTotal > 0) return byHourTotal;
  if (Number.isFinite(presentCount)) return Math.max(0, presentCount);
  return 0;
};

const buildMonthDayLabels = (dateKeys: string[]): string[] =>
  dateKeys.map((key) => String(new Date(`${key}T00:00:00.000Z`).getUTCDate()));

const buildDailyAccessCounts = (
  dateKeys: string[],
  summariesByDateKey: Map<string, DailySummary>
): number[] => dateKeys.map((key) => attendanceTotalFromSummary(summariesByDateKey.get(key)));

const updateSelectedDayAccess = (
  dateKeys: string[],
  dailyAccessCounts: number[],
  selectedDateKey: string,
  accessCount: number
): number[] => {
  const next = [...dailyAccessCounts];
  const index = dateKeys.indexOf(selectedDateKey);
  if (index >= 0) {
    next[index] = Math.max(next[index], accessCount);
  }
  return next;
};

const buildAccessAverageSeries = (
  dailyAccessCounts: number[]
): { accessAverage: number; accessAverageSeries: number[]; daysWithData: number } => {
  const accessTotalMonth = dailyAccessCounts.reduce((acc, v) => acc + v, 0);
  const daysWithData = dailyAccessCounts.reduce((acc, value) => acc + (value > 0 ? 1 : 0), 0);
  const accessAverage = daysWithData ? Number((accessTotalMonth / daysWithData).toFixed(2)) : 0;
  return {
    accessAverage,
    accessAverageSeries: dailyAccessCounts.map(() => accessAverage),
    daysWithData,
  };
};

const toHourIndex = (hour: number): number => {
  if (!Number.isFinite(hour)) return -1;
  const normalized = Math.max(0, Math.min(23, hour));
  return normalized === 0 ? 23 : normalized - 1;
};

const parseHourIndex = (value: string): number | null => {
  const hour = Number(String(value || "").split(":")[0]);
  const index = toHourIndex(hour);
  return index >= 0 ? index : null;
};

export {
  attendanceTotalFromSummary,
  buildMonthDayLabels,
  buildDailyAccessCounts,
  updateSelectedDayAccess,
  buildAccessAverageSeries,
  toHourIndex,
  parseHourIndex,
};
