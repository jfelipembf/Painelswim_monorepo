export type CashMovementType = "expense" | "income";

export type CashMovement = {
  id: string;
  idTenant: string;
  idBranch: string;
  type: CashMovementType;
  amountCents: number;
  category?: string;
  description?: string;
  dateKey: string;
  branchDateKey: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateCashMovementPayload = Omit<
  CashMovement,
  "id" | "idTenant" | "idBranch" | "branchDateKey" | "createdAt" | "updatedAt"
>;
