import type { ContractDurationType } from "hooks/contracts";

export type ContractFormValues = {
  id?: string;
  name: string;
  price: number | string;
  description: string;
  durationType: ContractDurationType | string;
  duration: number;
  maxInstallments: number;
  allowFreeze: boolean;
  maxSuspensionTimes: number;
  maxSuspensionDays: number;
  minimumSuspensionDays: number;
  allowedWeekdays: string[];
  accessControl: string;
  accessLimitCount: number;
  accessLimitPeriod: string;
  unlimitedInOriginBranch: boolean;
  allowsCancellationByApp: boolean;
};
