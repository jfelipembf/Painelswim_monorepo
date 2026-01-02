import type {
  CashMovement,
  CreateCashMovementPayload,
  CashMovementType,
} from "./cashMovements.types";

type CashMovementDocData = Omit<CashMovement, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const normalizeCashMovementDateKey = (dateKey: string): string =>
  String(dateKey || "").slice(0, 10);

export const buildBranchDateKey = (dateKey: string, idBranch: string): string =>
  `${normalizeCashMovementDateKey(dateKey)}_${String(idBranch || "")}`;

export const normalizeCreateCashMovementPayload = (
  payload: CreateCashMovementPayload
): CreateCashMovementPayload => {
  const dateKey = normalizeCashMovementDateKey(payload.dateKey);

  return {
    ...payload,
    dateKey,
    amountCents: Math.max(0, Math.round(Number(payload.amountCents || 0))),
    description: String(payload.description || "").trim(),
    category: String(payload.category || "").trim(),
  };
};

export const mapCashMovementDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  data: CashMovementDocData
): CashMovement => ({
  id,
  idTenant: data.idTenant || idTenant,
  idBranch: data.idBranch || idBranch,
  type: data.type as CashMovementType,
  amountCents: Number(data.amountCents || 0),
  category: data.category,
  description: data.description,
  dateKey: normalizeCashMovementDateKey(String(data.dateKey || "")),
  branchDateKey: String(data.branchDateKey || ""),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});
