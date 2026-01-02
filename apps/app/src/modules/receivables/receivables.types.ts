export type ReceivableStatus = "pending" | "paid" | "overdue" | "canceled";

export type ReceivableKind = "manual" | "card_installment";

export type Receivable = {
  id: string;
  idTenant: string;
  idBranch: string;
  saleId: string;
  clientId: string;
  consultantId: string;
  kind?: ReceivableKind;
  amountCents: number;
  amountPaidCents: number;
  dueDate: string;
  status: ReceivableStatus;
  anticipated?: boolean;
  paidAt?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ReceivablePayload = Omit<
  Receivable,
  "id" | "createdAt" | "updatedAt" | "amountPaidCents"
> & {
  amountPaidCents?: number;
};
