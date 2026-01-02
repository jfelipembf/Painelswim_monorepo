import type { DailySummary } from "./dailySummaries.types";

type DailySummaryDocData = Omit<DailySummary, "id"> & {
  idTenant?: string;
  idBranch?: string;
  dateKey?: string;
};

const hasAnyValue = (values: Record<string, unknown>): boolean =>
  Object.values(values).some((value) => value !== undefined);

const toNumberMaybe = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeRecordNumbers = (value: unknown): Record<string, number> | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return undefined;

  const result: Record<string, number> = {};
  entries.forEach(([key, entryValue]) => {
    const parsed = Number(entryValue);
    if (Number.isFinite(parsed)) {
      result[key] = parsed;
    }
  });

  return Object.keys(result).length ? result : undefined;
};

const pickAttendanceByHour = (raw: Record<string, unknown>): Record<string, number> | undefined => {
  const direct = normalizeRecordNumbers(raw["attendance.byHour"]);
  if (direct) return direct;

  const entries = Object.entries(raw).filter(([key]) => key.startsWith("attendance.byHour."));
  if (!entries.length) return undefined;

  const result = entries.reduce<Record<string, number>>((acc, [key, value]) => {
    const hourKey = key.replace("attendance.byHour.", "");
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      acc[hourKey] = parsed;
    }
    return acc;
  }, {});

  return Object.keys(result).length ? result : undefined;
};

export const mapDailySummaryDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: DailySummaryDocData
): DailySummary => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: raw.idBranch || idBranch,
  dateKey: String(raw.dateKey || id),
  attendance: (() => {
    const rawAny = raw as Record<string, unknown>;
    const fallback = {
      presentCount: toNumberMaybe(rawAny["attendance.presentCount"]),
      absentCount: toNumberMaybe(rawAny["attendance.absentCount"]),
      byHour: pickAttendanceByHour(rawAny),
    };
    if (raw.attendance) {
      return { ...fallback, ...raw.attendance };
    }
    return hasAnyValue(fallback) ? fallback : undefined;
  })(),
  memberships: (() => {
    const rawAny = raw as Record<string, unknown>;
    const fallback = {
      newCount: toNumberMaybe(rawAny["memberships.newCount"]),
      renewalCount: toNumberMaybe(rawAny["memberships.renewalCount"]),
      cancellationCount: toNumberMaybe(rawAny["memberships.cancellationCount"]),
    };
    if (raw.memberships) {
      return { ...fallback, ...raw.memberships };
    }
    return hasAnyValue(fallback) ? fallback : undefined;
  })(),
  sales: (() => {
    const rawAny = raw as Record<string, unknown>;
    const fallback = {
      count: toNumberMaybe(rawAny["sales.count"]),
      netTotalCents: toNumberMaybe(rawAny["sales.netTotalCents"]),
      discountCents: toNumberMaybe(rawAny["sales.discountCents"]),
      feesCents: toNumberMaybe(rawAny["sales.feesCents"]),
      paidTotalCents: toNumberMaybe(rawAny["sales.paidTotalCents"]),
      remainingCents: toNumberMaybe(rawAny["sales.remainingCents"]),
    };
    if (raw.sales) {
      return { ...fallback, ...raw.sales };
    }
    return hasAnyValue(fallback) ? fallback : undefined;
  })(),
  cashMovements: (() => {
    const rawAny = raw as Record<string, unknown>;
    const fallback = {
      incomeCents: toNumberMaybe(rawAny["cashMovements.incomeCents"]),
      expenseCents: toNumberMaybe(rawAny["cashMovements.expenseCents"]),
    };
    if (raw.cashMovements) {
      return { ...fallback, ...raw.cashMovements };
    }
    return hasAnyValue(fallback) ? fallback : undefined;
  })(),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});
