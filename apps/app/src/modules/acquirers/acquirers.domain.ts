import type { Acquirer, CardBrandKey, InstallmentFee } from "./acquirers.types";

type AcquirerDocData = Omit<Acquirer, "id"> & {
  idTenant?: string;
  idBranch?: string;
  brands?: Partial<Record<CardBrandKey, boolean>>;
  installmentFees?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const normalizeBrands = (
  brands?: Partial<Record<CardBrandKey, boolean>>
): Record<CardBrandKey, boolean> => ({
  visa: Boolean(brands?.visa),
  mastercard: Boolean(brands?.mastercard),
  elo: Boolean(brands?.elo),
  amex: Boolean(brands?.amex),
  hipercard: Boolean(brands?.hipercard),
  diners: Boolean(brands?.diners),
  other: Boolean(brands?.other),
});

export const normalizeInstallmentFees = (fees: unknown): InstallmentFee[] => {
  if (!Array.isArray(fees)) return [];
  return (fees as InstallmentFee[]).map((fee) => ({
    installment: Number((fee as InstallmentFee)?.installment || 0),
    active: Boolean((fee as InstallmentFee)?.active),
    feePercent: Number((fee as InstallmentFee)?.feePercent || 0),
  }));
};

export const normalizeAcquirerDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  data: AcquirerDocData
): Acquirer => ({
  id,
  idTenant: data.idTenant || idTenant,
  idBranch: data.idBranch || idBranch,
  name: String(data.name || ""),
  inactive: Boolean(data.inactive),
  brands: normalizeBrands(data.brands),
  otherBrandName: String(data.otherBrandName || ""),
  debitFeePercent: Number(data.debitFeePercent || 0),
  creditOneShotFeePercent: Number(data.creditOneShotFeePercent || 0),
  installmentFees: normalizeInstallmentFees(data.installmentFees),
  anticipateReceivables: Boolean(data.anticipateReceivables),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});
