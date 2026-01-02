export type ContractDurationType = "day" | "week" | "month" | "year";

export type Contract = {
  id: string;
  idTenant: string;
  idBranch: string;
  originBranchId: string;
  name: string;
  priceCents: number;
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
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ContractPayload = Omit<
  Contract,
  "id" | "idTenant" | "idBranch" | "createdAt" | "updatedAt" | "originBranchId"
> & {
  originBranchId: string;
};
