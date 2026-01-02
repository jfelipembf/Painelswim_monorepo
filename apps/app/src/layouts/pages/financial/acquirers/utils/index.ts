import type {
  Acquirer as DbAcquirer,
  AcquirerPayload,
  CardBrandKey,
  InstallmentFee,
} from "hooks/acquirers";

import type { AcquirerFormState } from "../types";

const EMPTY_BRANDS: Record<CardBrandKey, boolean> = {
  visa: false,
  mastercard: false,
  elo: false,
  amex: false,
  hipercard: false,
  diners: false,
  other: false,
};

const DEFAULT_NEW_BRANDS: Record<CardBrandKey, boolean> = {
  ...EMPTY_BRANDS,
  visa: true,
  mastercard: true,
};

const normalizeBrands = (
  brands?: Partial<Record<CardBrandKey, boolean>>
): Record<CardBrandKey, boolean> => ({
  ...EMPTY_BRANDS,
  ...(brands || {}),
});

const buildDefaultInstallments = (): InstallmentFee[] =>
  Array.from({ length: 12 }, (_, i) => ({
    installment: i + 1,
    active: i === 0,
    feePercent: 0,
  }));

const buildNewAcquirer = (): AcquirerFormState => ({
  id: "new",
  name: "",
  inactive: false,
  brands: DEFAULT_NEW_BRANDS,
  otherBrandName: "",
  debitFeePercent: 0,
  creditOneShotFeePercent: 0,
  installmentFees: buildDefaultInstallments(),
  anticipateReceivables: false,
});

const toForm = (a: DbAcquirer): AcquirerFormState => ({
  id: a.id,
  name: a.name,
  inactive: Boolean(a.inactive),
  brands: normalizeBrands(a.brands),
  otherBrandName: String(a.otherBrandName || ""),
  debitFeePercent: Number(a.debitFeePercent || 0),
  creditOneShotFeePercent: Number(a.creditOneShotFeePercent || 0),
  installmentFees: Array.isArray(a.installmentFees)
    ? a.installmentFees
    : buildDefaultInstallments(),
  anticipateReceivables: Boolean(a.anticipateReceivables),
});

const toPayload = (a: AcquirerFormState): AcquirerPayload => ({
  name: String(a.name || "").trim(),
  inactive: Boolean(a.inactive),
  brands: normalizeBrands(a.brands),
  otherBrandName: String(a.otherBrandName || ""),
  debitFeePercent: Number(a.debitFeePercent || 0),
  creditOneShotFeePercent: Number(a.creditOneShotFeePercent || 0),
  installmentFees: Array.isArray(a.installmentFees)
    ? a.installmentFees
    : buildDefaultInstallments(),
  anticipateReceivables: Boolean(a.anticipateReceivables),
});

const cloneForm = (form: AcquirerFormState): AcquirerFormState =>
  JSON.parse(JSON.stringify(form)) as AcquirerFormState;

export {
  buildDefaultInstallments,
  buildNewAcquirer,
  cloneForm,
  normalizeBrands,
  toForm,
  toPayload,
};
