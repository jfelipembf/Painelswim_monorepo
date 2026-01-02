import type { ContractFormValues } from "../types";

export const CONTRACT_FORM_INITIAL_VALUES: ContractFormValues = {
  name: "",
  price: "",
  description: "",
  durationType: "month",
  duration: 1,
  maxInstallments: 1,
  allowFreeze: false,
  maxSuspensionTimes: 0,
  maxSuspensionDays: 0,
  minimumSuspensionDays: 0,
  allowedWeekdays: [],
  accessControl: "unlimited",
  accessLimitCount: 0,
  accessLimitPeriod: "month",
  unlimitedInOriginBranch: false,
  allowsCancellationByApp: false,
};
