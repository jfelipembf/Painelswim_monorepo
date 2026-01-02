import type { ContractPayload } from "./contracts.types";

export const normalizeContractPayload = (payload: ContractPayload): ContractPayload => {
  return {
    ...payload,
    originBranchId: String(payload.originBranchId || "").trim(),
    name: String(payload.name || "").trim(),
    description: String(payload.description || "").trim(),
    priceCents: Math.max(0, Number(payload.priceCents || 0)),
    duration: Math.max(0, Number(payload.duration || 0)),
    maxInstallments: Math.max(0, Number(payload.maxInstallments || 0)),
    maxSuspensionTimes: Math.max(0, Number(payload.maxSuspensionTimes || 0)),
    maxSuspensionDays: Math.max(0, Number(payload.maxSuspensionDays || 0)),
    minimumSuspensionDays: Math.max(0, Number(payload.minimumSuspensionDays || 0)),
    allowedWeekdays: Array.isArray(payload.allowedWeekdays)
      ? payload.allowedWeekdays.map(String)
      : [],
    accessControl: String(payload.accessControl || ""),
    accessLimitCount: Math.max(0, Number(payload.accessLimitCount || 0)),
    accessLimitPeriod: String(payload.accessLimitPeriod || ""),
    unlimitedInOriginBranch: Boolean(payload.unlimitedInOriginBranch),
    allowsCancellationByApp: Boolean(payload.allowsCancellationByApp),
    allowFreeze: Boolean(payload.allowFreeze),
    active: payload.active !== false,
  };
};
