import type { PaymentMethod } from "hooks/sales";

export type { PaymentMethod };

export type PurchaseTab = "contracts" | "products" | "services";

export type PaymentMethodOption = { value: PaymentMethod; label: string };

export type PurchasePaymentDraft = {
  id: string;
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
};

export type CheckoutItem = {
  id: string;
  type: "membership" | "product" | "service";
  referenceId?: string;
  description: string;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
};

export type BranchOption = {
  id: string;
  name: string;
};
