export type CardBrandKey =
  | "visa"
  | "mastercard"
  | "elo"
  | "amex"
  | "hipercard"
  | "diners"
  | "other";

export type InstallmentFee = {
  installment: number;
  active: boolean;
  feePercent: number;
};

export type Acquirer = {
  id: string;
  idTenant: string;
  idBranch: string;
  name: string;
  inactive: boolean;
  brands: Record<CardBrandKey, boolean>;
  otherBrandName: string;
  debitFeePercent: number;
  creditOneShotFeePercent: number;
  installmentFees: InstallmentFee[];
  anticipateReceivables: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AcquirerPayload = Omit<
  Acquirer,
  "id" | "idTenant" | "idBranch" | "createdAt" | "updatedAt"
>;
