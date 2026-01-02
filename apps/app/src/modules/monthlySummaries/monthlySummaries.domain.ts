import type { MonthlySummary } from "./monthlySummaries.types";

type MonthlySummaryDocData = Omit<MonthlySummary, "id"> & {
  idTenant?: string;
  idBranch?: string;
  monthKey?: string;
};

const hasAnyValue = (values: Record<string, unknown>): boolean =>
  Object.values(values).some((value) => value !== undefined);

const toNumberMaybe = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const mapMonthlySummaryDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: MonthlySummaryDocData
): MonthlySummary => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: raw.idBranch || idBranch,
  monthKey: String(raw.monthKey || id),
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
