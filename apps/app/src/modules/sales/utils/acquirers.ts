import type { Acquirer } from "../../acquirers/acquirers.types";
import type { PaymentDraft } from "../sales.types";

const resolveAcquirer = (payment: PaymentDraft, acquirers: Acquirer[]): Acquirer | undefined => {
  const byId = String((payment as any).cardAcquirerId || "").trim();
  if (byId) {
    const found = acquirers.find((a) => String(a.id) === byId && !a.inactive);
    if (found) return found;
  }

  const byName = String((payment as any).cardAcquirer || "")
    .trim()
    .toLowerCase();
  if (!byName) return undefined;
  return acquirers.find(
    (a) =>
      String(a.name || "")
        .trim()
        .toLowerCase() === byName && !a.inactive
  );
};

const calcCardFeeCents = (payment: PaymentDraft, acquirers: Acquirer[]): number => {
  if (payment.method !== "credit" && payment.method !== "debit") return 0;
  const amountCents = Math.max(0, Number(payment.amountCents || 0));
  if (!amountCents) return 0;

  const acquirer = resolveAcquirer(payment, acquirers);
  if (!acquirer) return 0;

  let feePercent = 0;
  if (payment.method === "debit") {
    feePercent = Number(acquirer.debitFeePercent || 0);
  } else {
    const installments = Math.max(1, Number(payment.cardInstallments || 1));
    if (installments <= 1) {
      feePercent = Number(acquirer.creditOneShotFeePercent || 0);
    } else {
      const row = Array.isArray(acquirer.installmentFees)
        ? acquirer.installmentFees.find(
            (r: any) => Number(r.installment) === installments && Boolean(r.active)
          )
        : undefined;
      feePercent = Number((row as any)?.feePercent || 0);
    }
  }

  if (!Number.isFinite(feePercent) || feePercent <= 0) return 0;
  return Math.round((amountCents * feePercent) / 100);
};

const isCardAnticipated = (payment: PaymentDraft, acquirers: Acquirer[]): boolean => {
  if (payment.method !== "credit" && payment.method !== "debit") return false;
  const acquirer = resolveAcquirer(payment, acquirers);
  return Boolean(acquirer?.anticipateReceivables);
};

const calcCardAnticipationFeeCents = (payment: PaymentDraft, acquirers: Acquirer[]): number => {
  if (payment.method !== "credit") return 0;

  const installments = Math.max(1, Number(payment.cardInstallments || 1));
  if (installments <= 1) return 0;

  const amountCents = Math.max(0, Number(payment.amountCents || 0));
  if (!amountCents) return 0;

  const acquirer = resolveAcquirer(payment, acquirers);
  if (!acquirer) return 0;
  if (!acquirer?.anticipateReceivables) return 0;

  const row = Array.isArray(acquirer.installmentFees)
    ? acquirer.installmentFees.find(
        (r: any) => Number(r.installment) === installments && Boolean(r.active)
      )
    : undefined;

  const perInstallmentPercent = Number((row as any)?.feePercent || 0);
  if (!Number.isFinite(perInstallmentPercent) || perInstallmentPercent <= 0) return 0;

  const totalPercent = perInstallmentPercent * installments;
  return Math.round((amountCents * totalPercent) / 100);
};

export { resolveAcquirer, calcCardFeeCents, isCardAnticipated, calcCardAnticipationFeeCents };
