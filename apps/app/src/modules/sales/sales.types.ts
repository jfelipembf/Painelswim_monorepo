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
  updatedAt?: any;
};

export type ReceivableStatus = "pending" | "paid" | "overdue" | "canceled";

export type Receivable = {
  id: string;
  idTenant: string;
  saleId: string;
  clientId: string;
  idBranch: string;
  consultantId: string;
  amountCents: number;
  amountPaidCents?: number;
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
