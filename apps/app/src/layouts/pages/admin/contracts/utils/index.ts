import type { Contract, ContractPayload } from "hooks/contracts";

import type { ContractFormValues } from "../types";

export const toContractFormValues = (contract: Contract): ContractFormValues => ({
  id: contract.id,
  name: String(contract.name || ""),
  price: Number(contract.priceCents || 0) / 100,
  description: String(contract.description || ""),
  durationType: String(contract.durationType || "month"),
  duration: Number(contract.duration || 0),
  maxInstallments: Number(contract.maxInstallments || 0),
  allowFreeze: Boolean(contract.allowFreeze),
  maxSuspensionTimes: Number(contract.maxSuspensionTimes || 0),
  maxSuspensionDays: Number(contract.maxSuspensionDays || 0),
  minimumSuspensionDays: Number(contract.minimumSuspensionDays || 0),
  allowedWeekdays: Array.isArray(contract.allowedWeekdays)
    ? contract.allowedWeekdays.map(String)
    : [],
  accessControl: String(contract.accessControl || "unlimited"),
  accessLimitCount: Number(contract.accessLimitCount || 0),
  accessLimitPeriod: String(contract.accessLimitPeriod || "month"),
  unlimitedInOriginBranch: Boolean(contract.unlimitedInOriginBranch),
  allowsCancellationByApp: Boolean(contract.allowsCancellationByApp),
});

export const buildContractPayload = (
  formValues: ContractFormValues,
  originBranchId: string
): ContractPayload => ({
  originBranchId,
  name: String(formValues.name || ""),
  description: String(formValues.description || ""),
  priceCents: Math.round(Number(formValues.price || 0) * 100),
  durationType: String(formValues.durationType || "month"),
  duration: Number(formValues.duration || 0),
  maxInstallments: Number(formValues.maxInstallments || 0),
  allowFreeze: Boolean(formValues.allowFreeze),
  maxSuspensionTimes: Number(formValues.maxSuspensionTimes || 0),
  maxSuspensionDays: Number(formValues.maxSuspensionDays || 0),
  minimumSuspensionDays: Number(formValues.minimumSuspensionDays || 0),
  allowedWeekdays: Array.isArray(formValues.allowedWeekdays)
    ? formValues.allowedWeekdays.map(String)
    : [],
  accessControl: String(formValues.accessControl || "unlimited"),
  accessLimitCount: Number(formValues.accessLimitCount || 0),
  accessLimitPeriod: String(formValues.accessLimitPeriod || "month"),
  unlimitedInOriginBranch: Boolean(formValues.unlimitedInOriginBranch),
  allowsCancellationByApp: Boolean(formValues.allowsCancellationByApp),
  active: true,
});
