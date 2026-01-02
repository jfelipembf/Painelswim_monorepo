import type { Acquirer } from "hooks/acquirers";
import {
  calcCardAnticipationFeeCents,
  calcCardFeeCents,
  isCardAnticipated,
  type CreateSalePayload,
  type PaymentDraft as SalePaymentDraft,
} from "hooks/sales";

import type { CheckoutItem, PurchasePaymentDraft } from "../types";

export const buildSaleItems = (checkoutItems: CheckoutItem[]): CreateSalePayload["items"] =>
  checkoutItems.map((item) => {
    const base = {
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: Number(item.unitPriceCents || 0),
      totalCents: Number(item.totalCents || 0),
    };
    if (item.type === "membership" && item.referenceId) {
      return { ...base, planId: item.referenceId };
    }
    return base;
  });

export const buildSalePayments = (
  payments: PurchasePaymentDraft[],
  acquirers: Acquirer[]
): { payments: SalePaymentDraft[]; feesCents: number } => {
  const basePayments: SalePaymentDraft[] = payments.map((payment) => ({
    method: payment.method,
    amountCents: payment.amountCents,
    pixTxid: payment.pixTxid,
    transferBankName: payment.transferBankName,
    transferReference: payment.transferReference,
    cardAcquirerId: payment.cardAcquirerId,
    cardAcquirer: payment.cardAcquirer,
    cardBrand: payment.cardBrand,
    cardInstallments: payment.cardInstallments,
    cardAuthCode: payment.cardAuthCode,
  }));

  const normalizedPayments: SalePaymentDraft[] = basePayments.map((payment) => {
    const cardAnticipated = isCardAnticipated(payment, acquirers);
    const cardAnticipationFeeCents = cardAnticipated
      ? calcCardAnticipationFeeCents(payment, acquirers)
      : 0;
    const cardFeeCents = cardAnticipated ? 0 : calcCardFeeCents(payment, acquirers);

    return {
      ...payment,
      cardFeeCents: cardFeeCents > 0 ? cardFeeCents : 0,
      cardAnticipated,
      cardAnticipationFeeCents: cardAnticipationFeeCents > 0 ? cardAnticipationFeeCents : 0,
    };
  });

  const feesCents = normalizedPayments.reduce(
    (acc, payment) =>
      acc + Number(payment.cardFeeCents || 0) + Number(payment.cardAnticipationFeeCents || 0),
    0
  );

  return { payments: normalizedPayments, feesCents };
};
