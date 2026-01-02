import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import {
  buildBranchDateKey,
  mapCashMovementDoc,
  normalizeCashMovementDateKey,
  normalizeCreateCashMovementPayload,
} from "./cashMovements.domain";

import type {
  CashMovement,
  CashMovementType,
  CreateCashMovementPayload,
} from "./cashMovements.types";

type CashMovementDocData = Omit<CashMovement, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const cashMovementsCollection = (idTenant: string, idBranch: string) => {
  const db = getFirebaseDb();
  return collection(db, "tenants", idTenant, "branches", idBranch, "cashMovements");
};

export const createCashMovement = async (
  idTenant: string,
  idBranch: string,
  payload: CreateCashMovementPayload
): Promise<string> => {
  if (!idTenant || !idBranch) {
    throw new Error("Tenant e unidade são obrigatórios.");
  }

  const normalized = normalizeCreateCashMovementPayload(payload);
  const dateKey = normalizeCashMovementDateKey(normalized.dateKey);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("dateKey inválido.");
  }

  const db = getFirebaseDb();
  const ref = doc(cashMovementsCollection(idTenant, idBranch));

  await setDoc(ref, {
    idTenant,
    idBranch,
    ...normalized,
    dateKey,
    branchDateKey: buildBranchDateKey(dateKey, idBranch),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const monthKey = dateKey.slice(0, 7);
  const summaryRef = doc(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "monthlySummaries",
    monthKey
  );
  await setDoc(
    summaryRef,
    {
      idTenant,
      idBranch,
      monthKey,
      cashMovements: {
        incomeCents:
          normalized.type === "income"
            ? increment(Number(normalized.amountCents || 0))
            : increment(0),
        expenseCents:
          normalized.type === "expense"
            ? increment(Number(normalized.amountCents || 0))
            : increment(0),
      },
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  const dailySummaryRef = doc(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "dailySummaries",
    dateKey
  );
  await setDoc(
    dailySummaryRef,
    {
      idTenant,
      idBranch,
      dateKey,
      cashMovements: {
        incomeCents:
          normalized.type === "income"
            ? increment(Number(normalized.amountCents || 0))
            : increment(0),
        expenseCents:
          normalized.type === "expense"
            ? increment(Number(normalized.amountCents || 0))
            : increment(0),
      },
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return ref.id;
};

export const fetchCashMovementsRange = async (
  idTenant: string,
  idBranch: string,
  startDateKey: string,
  endDateKey: string,
  type?: CashMovementType
): Promise<CashMovement[]> => {
  if (!idTenant || !idBranch || !startDateKey || !endDateKey) return [];

  const start = normalizeCashMovementDateKey(startDateKey);
  const end = normalizeCashMovementDateKey(endDateKey);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return [];
  }

  const ref = cashMovementsCollection(idTenant, idBranch);

  const constraints: any[] = [where("dateKey", ">=", start), where("dateKey", "<=", end)];
  if (type) {
    constraints.push(where("type", "==", type));
  }

  const q = query(ref, ...constraints, orderBy("dateKey", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) =>
    mapCashMovementDoc(idTenant, idBranch, d.id, d.data() as CashMovementDocData)
  );
};

export const fetchCashMovementsByBranchDateKey = async (
  idTenant: string,
  idBranch: string,
  branchDateKey: string
): Promise<CashMovement[]> => {
  if (!idTenant || !idBranch || !branchDateKey) return [];

  const ref = cashMovementsCollection(idTenant, idBranch);
  const snap = await getDocs(
    query(ref, where("branchDateKey", "==", branchDateKey), orderBy("createdAt", "desc"))
  );

  return snap.docs.map((d) =>
    mapCashMovementDoc(idTenant, idBranch, d.id, d.data() as CashMovementDocData)
  );
};
