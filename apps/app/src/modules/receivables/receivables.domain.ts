import type { ReceivablePayload, ReceivableStatus } from "./receivables.types";

export const normalizeReceivableStatus = (value: unknown): ReceivableStatus => {
  const v = String(value || "");
  return v === "paid" || v === "overdue" || v === "canceled" ? (v as any) : "pending";
};

export const normalizeReceivablePayload = (payload: ReceivablePayload): ReceivablePayload => {
  return {
    ...payload,
    idTenant: String(payload.idTenant || "").trim(),
    idBranch: String(payload.idBranch || "").trim(),
    saleId: String(payload.saleId || "").trim(),
    clientId: String(payload.clientId || "").trim(),
    consultantId: String(payload.consultantId || "").trim(),
    amountCents: Math.max(0, Math.round(Number(payload.amountCents || 0))),
    amountPaidCents: Math.max(0, Math.round(Number(payload.amountPaidCents || 0))),
    dueDate: String(payload.dueDate || "").slice(0, 10),
    status: normalizeReceivableStatus(payload.status),
    paidAt: payload.paidAt ? String(payload.paidAt) : undefined,
  };
};
