import type {
  BranchAutomationSettings,
  BranchAutomationSettingsInput,
} from "./branchSettings.types";

export const DEFAULT_BRANCH_SETTINGS: BranchAutomationSettings = {
  idTenant: "",
  idBranch: "",
  inactiveAfterRenewalDays: 0,
  attendanceSummaryAtMidnight: false,
  abandonmentRiskEnabled: false,
  abandonmentRiskDays: 0,
  autoCloseCashierAtMidnight: false,
  cancelContractsAfterDaysWithoutPayment: 0,
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const toBoolean = (value: unknown): boolean => Boolean(value);

export const normalizeBranchSettings = (
  input: BranchAutomationSettingsInput
): BranchAutomationSettings => ({
  idTenant: String(input.idTenant || "").trim(),
  idBranch: String(input.idBranch || "").trim(),
  inactiveAfterRenewalDays: toNumber(input.inactiveAfterRenewalDays),
  attendanceSummaryAtMidnight: toBoolean(input.attendanceSummaryAtMidnight),
  abandonmentRiskEnabled: toBoolean(input.abandonmentRiskEnabled),
  abandonmentRiskDays: toNumber(input.abandonmentRiskDays),
  autoCloseCashierAtMidnight: toBoolean(input.autoCloseCashierAtMidnight),
  cancelContractsAfterDaysWithoutPayment: toNumber(input.cancelContractsAfterDaysWithoutPayment),
  createdAt: input.createdAt,
  updatedAt: input.updatedAt,
});
