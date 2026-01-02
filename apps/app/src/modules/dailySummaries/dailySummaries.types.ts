export type DailySummary = {
  id: string;
  idTenant: string;
  idBranch: string;
  dateKey: string;
  attendance?: {
    presentCount?: number;
    absentCount?: number;
    byHour?: Record<string, number>;
  };
  memberships?: {
    newCount?: number;
    renewalCount?: number;
    cancellationCount?: number;
  };
  sales?: {
    count?: number;
    netTotalCents?: number;
    discountCents?: number;
    feesCents?: number;
    paidTotalCents?: number;
    remainingCents?: number;
  };
  cashMovements?: {
    incomeCents?: number;
    expenseCents?: number;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
};
