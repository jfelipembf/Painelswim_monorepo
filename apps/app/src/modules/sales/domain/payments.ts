import {
  doc,
  increment,
  serverTimestamp,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Transaction,
} from "firebase/firestore";

import type { PaymentDraft, PaymentMethod } from "../sales.types";
import { addMonthsIsoDateKey } from "./date";
import { removeUndefinedDeep } from "./sanitize";

const splitInstallments = (totalCents: number, installments: number): number[] => {
  const n = Math.max(1, Number(installments || 1));
  const total = Math.max(0, Number(totalCents || 0));
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  return Array.from({ length: n }, (_, idx) => base + (idx < remainder ? 1 : 0));
};

const CARD_PAYMENT_METHODS: PaymentMethod[] = ["credit", "debit"];

const isCardPayment = (payment: PaymentDraft): boolean =>
  CARD_PAYMENT_METHODS.includes(payment.method);

const sanitizePayments = (payments?: PaymentDraft[]): PaymentDraft[] =>
  Array.isArray(payments) ? payments.filter(Boolean) : [];

export type CardReceivableContext = {
  idTenant: string;
  saleId: string;
  clientId: string;
  idBranch: string;
  consultantId: string;
  dateKey: string;
};

type CardReceivableParams = {
  tx: Transaction;
  receivablesRef: CollectionReference<DocumentData>;
  payments: PaymentDraft[];
  context: CardReceivableContext;
};

const createCardReceivables = ({
  tx,
  receivablesRef,
  payments,
  context,
}: CardReceivableParams): void => {
  payments.filter(isCardPayment).forEach((payment) => {
    const sanitizedPayment = removeUndefinedDeep(payment);
    const totalCents = Math.max(0, Number(payment.amountCents || 0));
    if (!totalCents) {
      return;
    }

    const installments =
      payment.method === "credit" ? Math.max(1, Number(payment.cardInstallments || 1)) : 1;
    const installmentValues = splitInstallments(totalCents, installments);

    const totalFeeCents =
      Math.max(0, Number(payment.cardFeeCents || 0)) +
      Math.max(0, Number(payment.cardAnticipationFeeCents || 0));
    const feeParts = splitInstallments(totalFeeCents, installments);

    installmentValues.forEach((grossPart, idx) => {
      const feePart = Number(feeParts[idx] || 0);
      const netPart = Math.max(0, grossPart - feePart);
      const installmentNumber = idx + 1;
      const anticipated = Boolean(payment.cardAnticipated);
      const dueDateKey = anticipated
        ? context.dateKey
        : addMonthsIsoDateKey(context.dateKey, installmentNumber);

      const receivableRef = doc(receivablesRef);
      tx.set(receivableRef, {
        idTenant: context.idTenant,
        idBranch: context.idBranch,
        kind: "card_installment",
        saleId: context.saleId,
        clientId: context.clientId,
        consultantId: context.consultantId,
        installmentNumber,
        totalInstallments: installments,
        grossCents: grossPart,
        feesCents: feePart,
        netCents: netPart,
        amountCents: netPart,
        amountPaidCents: 0,
        dueDate: dueDateKey,
        status: "pending",
        anticipated,
        anticipatedAt: anticipated ? new Date().toISOString() : undefined,
        payment: sanitizedPayment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  });
};

type ManualReceivableParams = {
  tx: Transaction;
  receivablesRef: CollectionReference<DocumentData>;
  clientRef: DocumentReference<DocumentData>;
  context: CardReceivableContext;
  amountCents: number;
  dueDate: string;
};

const createManualReceivable = ({
  tx,
  receivablesRef,
  clientRef,
  context,
  amountCents,
  dueDate,
}: ManualReceivableParams): void => {
  const normalizedAmount = Math.max(0, Number(amountCents || 0));
  const receivableRef = doc(receivablesRef);
  tx.set(receivableRef, {
    idTenant: context.idTenant,
    idBranch: context.idBranch,
    kind: "manual",
    saleId: context.saleId,
    clientId: context.clientId,
    consultantId: context.consultantId,
    amountCents: normalizedAmount,
    amountPaidCents: 0,
    dueDate,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (normalizedAmount > 0) {
    tx.set(
      clientRef,
      {
        debtCents: increment(normalizedAmount),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
};

export {
  splitInstallments,
  isCardPayment,
  sanitizePayments,
  createCardReceivables,
  createManualReceivable,
};
