import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import { normalizeContractPayload } from "./contracts.domain";

import type { Contract, ContractPayload } from "./contracts.types";

type ContractDocData = ContractPayload & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type ContractSnapshot =
  | QueryDocumentSnapshot<DocumentData, DocumentData>
  | DocumentSnapshot<DocumentData, DocumentData>;

const mapContractSnapshot = (
  snapshot: ContractSnapshot,
  fallbackTenant: string,
  fallbackBranch: string
): Contract => {
  const raw = snapshot.data() as ContractDocData | undefined;
  if (!raw) {
    throw new Error("Contrato inválido.");
  }

  return {
    id: snapshot.id,
    idTenant: String(raw.idTenant || fallbackTenant),
    idBranch: String(raw.idBranch || fallbackBranch),
    originBranchId: String(raw.originBranchId || ""),
    name: String(raw.name || ""),
    priceCents: Number(raw.priceCents || 0),
    description: String(raw.description || ""),
    durationType: raw.durationType,
    duration: Number(raw.duration || 0),
    maxInstallments: Number(raw.maxInstallments || 0),
    allowFreeze: Boolean(raw.allowFreeze),
    maxSuspensionTimes: Number(raw.maxSuspensionTimes || 0),
    maxSuspensionDays: Number(raw.maxSuspensionDays || 0),
    minimumSuspensionDays: Number(raw.minimumSuspensionDays || 0),
    allowedWeekdays: Array.isArray(raw.allowedWeekdays) ? raw.allowedWeekdays.map(String) : [],
    accessControl: String(raw.accessControl || ""),
    accessLimitCount: Number(raw.accessLimitCount || 0),
    accessLimitPeriod: String(raw.accessLimitPeriod || ""),
    unlimitedInOriginBranch: Boolean(raw.unlimitedInOriginBranch),
    allowsCancellationByApp: Boolean(raw.allowsCancellationByApp),
    active: raw.active !== false,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

export const fetchContracts = async (
  idTenant: string,
  idBranch: string,
  options?: { activeOnly?: boolean }
): Promise<Contract[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "contracts");
  const activeOnly = options?.activeOnly ?? true;

  const constraints: QueryConstraint[] = [];
  if (activeOnly) constraints.push(where("active", "==", true));
  constraints.push(orderBy("createdAt", "desc"));

  const snap = await getDocs(query(ref, ...constraints));
  return snap.docs.map((d) => mapContractSnapshot(d, idTenant, idBranch));
};

export const fetchContractById = async (
  idTenant: string,
  idBranch: string,
  contractId: string
): Promise<Contract | null> => {
  if (!idTenant || !idBranch || !contractId) return null;
  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "contracts", contractId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapContractSnapshot(snap, idTenant, idBranch);
};

export const createContract = async (
  idTenant: string,
  idBranch: string,
  payload: ContractPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade não identificados.");
  const normalized = normalizeContractPayload(payload);
  if (!normalized.originBranchId) throw new Error("Unidade de origem é obrigatória.");
  if (!normalized.name) throw new Error("Nome do contrato é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "contracts"));

  await setDoc(ref, {
    idTenant,
    idBranch,
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
};

export const updateContract = async (
  idTenant: string,
  idBranch: string,
  contractId: string,
  payload: Partial<ContractPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !contractId) throw new Error("Contrato não identificado.");
  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "contracts", contractId);

  const normalized = normalizeContractPayload({
    originBranchId: String(payload.originBranchId || ""),
    name: String(payload.name || ""),
    description: String(payload.description || ""),
    priceCents: Number(payload.priceCents || 0),
    durationType: String(payload.durationType || ""),
    duration: Number(payload.duration || 0),
    maxInstallments: Number(payload.maxInstallments || 0),
    allowFreeze: Boolean(payload.allowFreeze),
    maxSuspensionTimes: Number(payload.maxSuspensionTimes || 0),
    maxSuspensionDays: Number(payload.maxSuspensionDays || 0),
    minimumSuspensionDays: Number(payload.minimumSuspensionDays || 0),
    allowedWeekdays: Array.isArray(payload.allowedWeekdays)
      ? payload.allowedWeekdays.map(String)
      : [],
    accessControl: String(payload.accessControl || ""),
    accessLimitCount: Number(payload.accessLimitCount || 0),
    accessLimitPeriod: String(payload.accessLimitPeriod || ""),
    unlimitedInOriginBranch: Boolean(payload.unlimitedInOriginBranch),
    allowsCancellationByApp: Boolean(payload.allowsCancellationByApp),
    active: payload.active !== false,
  });

  await setDoc(
    ref,
    {
      idTenant,
      idBranch,
      ...normalized,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const deleteContract = async (
  idTenant: string,
  idBranch: string,
  contractId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !contractId) throw new Error("Contrato não identificado.");
  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "contracts", contractId);
  await deleteDoc(ref);
};
