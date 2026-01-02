import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { omitUndefined } from "../../utils/omitUndefined";

import { getFirebaseDb } from "../../services/firebase";

import { normalizeAcquirerDoc } from "./acquirers.domain";

import type { Acquirer, AcquirerPayload, CardBrandKey } from "./acquirers.types";

type AcquirerDocData = Omit<Acquirer, "id"> & {
  idTenant?: string;
  idBranch?: string;
  brands?: Partial<Record<CardBrandKey, boolean>>;
  installmentFees?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const acquirersCollection = (idTenant: string, idBranch: string) => {
  const db = getFirebaseDb();
  return collection(db, "tenants", idTenant, "branches", idBranch, "acquirers");
};

export const fetchAcquirers = async (idTenant: string, idBranch: string): Promise<Acquirer[]> => {
  if (!idTenant || !idBranch) return [];

  const ref = acquirersCollection(idTenant, idBranch);
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));

  return snap.docs.map((d) =>
    normalizeAcquirerDoc(idTenant, idBranch, d.id, d.data() as AcquirerDocData)
  );
};

export const createAcquirer = async (
  idTenant: string,
  idBranch: string,
  payload: AcquirerPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant e unidade são obrigatórios.");
  if (!payload?.name?.trim()) throw new Error("Nome da adquirente é obrigatório.");

  const ref = doc(acquirersCollection(idTenant, idBranch));

  await setDoc(ref, {
    idTenant,
    idBranch,
    ...payload,
    name: payload.name.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
};

export const updateAcquirer = async (
  idTenant: string,
  idBranch: string,
  acquirerId: string,
  payload: Partial<AcquirerPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !acquirerId) throw new Error("Adquirente não identificada.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "acquirers", acquirerId);

  const updateData = omitUndefined({
    ...payload,
    name: payload.name ? payload.name.trim() : undefined,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, updateData);
};

export const deleteAcquirer = async (
  idTenant: string,
  idBranch: string,
  acquirerId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !acquirerId) throw new Error("Adquirente não identificada.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "acquirers", acquirerId);
  await deleteDoc(ref);
};
