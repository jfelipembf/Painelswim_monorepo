export type MonthlySummary = {
  id: string;
  idTenant: string;
  idBranch: string;
  monthKey: string;
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
