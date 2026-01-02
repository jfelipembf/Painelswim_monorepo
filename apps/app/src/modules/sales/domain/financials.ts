import type { CreateSalePayload, SaleStatus } from "../sales.types";

const computeSaleStatus = (remainingCents: number): SaleStatus =>
  remainingCents > 0 ? "open" : "paid";

const resolveFinancials = (
  payload: CreateSalePayload
): { feesCents: number; netPaidTotalCents: number } => ({
  feesCents: Math.max(0, Number(payload.feesCents || 0)),
  netPaidTotalCents: Math.max(0, Number(payload.netPaidTotalCents ?? payload.paidTotalCents ?? 0)),
});

export { computeSaleStatus, resolveFinancials };
