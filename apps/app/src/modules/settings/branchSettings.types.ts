export type BranchAutomationSettings = {
  idTenant: string;
  idBranch: string;
  inactiveAfterRenewalDays: number;
  attendanceSummaryAtMidnight: boolean;
  abandonmentRiskEnabled: boolean;
  abandonmentRiskDays: number;
  autoCloseCashierAtMidnight: boolean;
  cancelContractsAfterDaysWithoutPayment: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type BranchAutomationSettingsInput = Partial<BranchAutomationSettings>;
