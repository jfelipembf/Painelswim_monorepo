import {
  Transaction,
  collection,
  doc,
  serverTimestamp,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";

export type SaleStatus = "open" | "paid" | "canceled";

export type SaleItemType = "membership" | "product" | "service";

export type SaleItem = {
  type: SaleItemType;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  membershipId?: string;
  planId?: string;
};

export type PaymentMethod = "cash" | "pix" | "transfer" | "credit" | "debit";

export type PaymentDraft = {
  method: PaymentMethod;
  amountCents: number;
  pixTxid?: string;
  transferBankName?: string;
  transferReference?: string;
  cardAcquirerId?: string;
  cardAcquirer?: string;
  cardBrand?: string;
  cardInstallments?: number;
  cardAuthCode?: string;
  cardFeeCents?: number;
  cardAnticipated?: boolean;
  cardAnticipationFeeCents?: number;
};

export type ReceivableStatus = "pending" | "paid" | "overdue" | "canceled";

export type Receivable = {
  id: string;
  idTenant: string;
  saleId: string;
  clientId: string;
  amountCents: number;
  dueDate: string;
  status: ReceivableStatus;
  paidAt?: string;
  payment?: PaymentDraft;
  kind?: "manual" | "card_installment";
  installmentNumber?: number;
  totalInstallments?: number;
  grossCents?: number;
  feesCents?: number;
  netCents?: number;
  anticipated?: boolean;
  anticipatedAt?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateSalePayload = {
  clientId: string;
  idBranch: string;
  consultantId: string;
  consultantName?: string;
  clientSnapshot?: {
    id: string;
    name: string;
    friendlyId?: string;
    photoUrl?: string;
  };
  items: SaleItem[];
  grossTotalCents: number;
  discountCents: number;
  netTotalCents: number;
  feesCents?: number;
  netPaidTotalCents?: number;
  paidTotalCents: number;
  remainingCents: number;
  dueDate?: string;
  payments: PaymentDraft[];
  membership?: {
    planId: string;
    planName: string;
    priceCents: number;
    startAt: string;
    durationType: "day" | "week" | "month" | "year";
    duration: number;
    allowCrossBranchAccess: boolean;
    allowedBranchIds?: string[];
  };
};

export type Sale = CreateSalePayload & {
  id: string;
  idTenant: string;
  status: SaleStatus;
  dateKey?: string;
  branchDateKey?: string;
  createdAt?: any;
};

export const removeUndefinedDeep = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((v) => removeUndefinedDeep(v));
  }

  if (value && typeof value === "object") {
    const result: Record<string, any> = {};
    Object.entries(value).forEach(([k, v]) => {
      if (v === undefined) return;
      result[k] = removeUndefinedDeep(v);
    });
    return result;
  }

  return value;
};

export const addMonthsIsoDateKey = (dateKey: string, monthsToAdd: number): string => {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCMonth(base.getUTCMonth() + Number(monthsToAdd || 0));
  return String(base.toISOString()).slice(0, 10);
};

export const addDaysIsoDateKey = (dateKey: string, daysToAdd: number): string => {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + Number(daysToAdd || 0));
  return String(base.toISOString()).slice(0, 10);
};

export const addYearsIsoDateKey = (dateKey: string, yearsToAdd: number): string => {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCFullYear(base.getUTCFullYear() + Number(yearsToAdd || 0));
  return String(base.toISOString()).slice(0, 10);
};

export const toIsoDateKey = (iso: string): string => String(iso || "").slice(0, 10);

export const computeMembershipEndAtDateKey = (
  startAtIso: string,
  durationType: "day" | "week" | "month" | "year",
  duration: number
): string | undefined => {
  const startKey = toIsoDateKey(startAtIso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startKey)) return undefined;

  const n = Math.max(1, Number(duration || 1));
  const exclusiveEndKey =
    durationType === "day"
      ? addDaysIsoDateKey(startKey, n)
      : durationType === "week"
      ? addDaysIsoDateKey(startKey, n * 7)
      : durationType === "month"
      ? addMonthsIsoDateKey(startKey, n)
      : addYearsIsoDateKey(startKey, n);

  return addDaysIsoDateKey(exclusiveEndKey, -1);
};

export const splitInstallments = (totalCents: number, installments: number): number[] => {
  const n = Math.max(1, Number(installments || 1));
  const total = Math.max(0, Number(totalCents || 0));
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  return Array.from({ length: n }, (_, idx) => base + (idx < remainder ? 1 : 0));
};

const CARD_PAYMENT_METHODS: PaymentMethod[] = ["credit", "debit"];

export const isCardPayment = (payment: PaymentDraft): boolean =>
  CARD_PAYMENT_METHODS.includes(payment.method);

export const sanitizePayments = (payments?: PaymentDraft[]): PaymentDraft[] =>
  Array.isArray(payments)
    ? payments.filter((payment): payment is PaymentDraft => Boolean(payment))
    : [];

export const getTodayDateKey = (): string => String(new Date().toISOString()).slice(0, 10);

export const buildBranchDateKey = (dateKey: string, branchId: string): string =>
  `${dateKey}_${branchId}`;

export const computeSaleStatus = (remainingCents: number): SaleStatus =>
  remainingCents > 0 ? "open" : "paid";

export const resolveFinancials = (
  payload: CreateSalePayload
): { feesCents: number; netPaidTotalCents: number } => ({
  feesCents: Math.max(0, Number(payload.feesCents || 0)),
  netPaidTotalCents: Math.max(0, Number(payload.netPaidTotalCents ?? payload.paidTotalCents ?? 0)),
});

export const injectMembershipId = (
  items: SaleItem[],
  membershipId?: string,
  membershipIndex?: number
): SaleItem[] => {
  if (!membershipId || typeof membershipIndex !== "number" || membershipIndex < 0) {
    return items;
  }

  return items.map((item, idx) => (idx === membershipIndex ? { ...item, membershipId } : item));
};

export const generateMembershipId = (db: Firestore, idTenant: string, clientId: string): string => {
  const membershipsCollection = collection(
    db,
    "tenants",
    idTenant,
    "clients",
    clientId,
    "memberships"
  );
  return doc(membershipsCollection).id;
};

type SaleDocumentParams = {
  idTenant: string;
  sanitizedPayload: Record<string, any>;
  dateKey: string;
  branchDateKey: string;
  items: SaleItem[];
  status: SaleStatus;
  feesCents: number;
  netPaidTotalCents: number;
};

export const buildSaleDocument = ({
  idTenant,
  sanitizedPayload,
  dateKey,
  branchDateKey,
  items,
  status,
  feesCents,
  netPaidTotalCents,
}: SaleDocumentParams) => ({
  idTenant,
  ...sanitizedPayload,
  dateKey,
  branchDateKey,
  items,
  status,
  feesCents,
  netPaidTotalCents,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

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

export const createCardReceivables = ({
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
        kind: "card_installment",
        saleId: context.saleId,
        clientId: context.clientId,
        idBranch: context.idBranch,
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
  context: CardReceivableContext;
  amountCents: number;
  dueDate: string;
};

export const createManualReceivable = ({
  tx,
  receivablesRef,
  context,
  amountCents,
  dueDate,
}: ManualReceivableParams): void => {
  const receivableRef = doc(receivablesRef);
  tx.set(receivableRef, {
    idTenant: context.idTenant,
    kind: "manual",
    saleId: context.saleId,
    clientId: context.clientId,
    idBranch: context.idBranch,
    consultantId: context.consultantId,
    amountCents,
    amountPaidCents: 0,
    dueDate,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

type MembershipRecordParams = {
  tx: Transaction;
  db: Firestore;
  idTenant: string;
  clientRef: DocumentReference<DocumentData>;
  clientId: string;
  idBranch: string;
  membershipId: string;
  saleId: string;
  membership: NonNullable<CreateSalePayload["membership"]>;
  remainingCents: number;
  status: "active" | "pending";
  endAt?: string;
  previousMembershipId?: string;
  activateClient: boolean;
};

export const createMembershipRecords = ({
  tx,
  db,
  idTenant,
  clientRef,
  clientId,
  idBranch,
  membershipId,
  saleId,
  membership,
  remainingCents,
  status,
  endAt,
  previousMembershipId,
  activateClient,
}: MembershipRecordParams): void => {
  const membershipRef = doc(
    db,
    "tenants",
    idTenant,
    "clients",
    clientId,
    "memberships",
    membershipId
  );

  if (previousMembershipId) {
    const previousRef = doc(
      db,
      "tenants",
      idTenant,
      "clients",
      clientId,
      "memberships",
      previousMembershipId
    );
    tx.set(
      previousRef,
      {
        nextMembershipId: membershipId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const membershipDoc = removeUndefinedDeep({
    idTenant,
    clientId,
    idBranch,
    planId: membership.planId,
    planName: membership.planName,
    priceCents: membership.priceCents,
    startAt: membership.startAt,
    durationType: membership.durationType,
    duration: membership.duration,
    endAt,
    status,
    previousMembershipId,
    allowCrossBranchAccess: Boolean(membership.allowCrossBranchAccess),
    allowedBranchIds: membership.allowedBranchIds || [],
    saleId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }) as Record<string, unknown>;

  tx.set(membershipRef, membershipDoc);

  if (activateClient) {
    tx.set(
      clientRef,
      {
        status: "active",
        updatedAt: serverTimestamp(),
        activeMembershipId: membershipId,
        activeSaleId: saleId,
        debtCents: Math.max(0, Number(remainingCents || 0)),
        access: {
          allowCrossBranchAccess: Boolean(membership.allowCrossBranchAccess),
          allowedBranchIds: membership.allowedBranchIds || [],
        },
      },
      { merge: true }
    );
  } else {
    tx.set(
      clientRef,
      {
        updatedAt: serverTimestamp(),
        scheduledMembershipId: membershipId,
        debtCents: Math.max(0, Number(remainingCents || 0)),
      },
      { merge: true }
    );
  }
};
