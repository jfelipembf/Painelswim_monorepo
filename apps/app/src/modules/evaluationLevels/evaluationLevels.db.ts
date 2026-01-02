import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import type { EvaluationLevel, EvaluationLevelPayload } from "./evaluationLevels.types";

type EvaluationLevelDocData = Omit<EvaluationLevel, "id"> & {
  idTenant?: string;
  idBranch?: string;
};

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

const mapEvaluationLevelDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: EvaluationLevelDocData
): EvaluationLevel => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: String(raw.idBranch || idBranch),
  name: String(raw.name || ""),
  value: Number(raw.value || 0),
  order: typeof raw.order === "number" ? raw.order : 0,
  inactive: Boolean(raw.inactive),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const fetchEvaluationLevels = async (
  idTenant: string,
  idBranch: string
): Promise<EvaluationLevel[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "evaluationLevels");
  const snap = await getDocs(query(ref, orderBy("order", "asc")));
  return snap.docs
    .map((d) => mapEvaluationLevelDoc(idTenant, idBranch, d.id, d.data() as EvaluationLevelDocData))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const getNextEvaluationLevelOrder = async (
  idTenant: string,
  idBranch: string
): Promise<number> => {
  if (!idTenant || !idBranch) return 0;

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "evaluationLevels");
  const q = query(ref, orderBy("order", "desc"), limit(1));

  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const last = snap.docs[0].data() as { order?: number };
  const maxOrder = typeof last.order === "number" ? last.order : 0;
  return maxOrder + 1;
};

export const createEvaluationLevel = async (
  idTenant: string,
  idBranch: string,
  payload: EvaluationLevelPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "evaluationLevels"));

  await setDoc(
    ref,
    removeUndefinedFields({
      idTenant,
      idBranch,
      ...payload,
      name: String(payload.name || "").trim(),
      value: Number(payload.value || 0),
      order: typeof payload.order === "number" ? Math.round(payload.order) : 0,
      inactive: Boolean(payload.inactive),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return ref.id;
};

export const updateEvaluationLevel = async (
  idTenant: string,
  idBranch: string,
  levelId: string,
  payload: Partial<EvaluationLevelPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !levelId) throw new Error("Nível não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "evaluationLevels", levelId);

  await updateDoc(
    ref,
    removeUndefinedFields({
      ...payload,
      name: payload.name !== undefined ? String(payload.name).trim() : undefined,
      value: payload.value !== undefined ? Number(payload.value || 0) : undefined,
      order: payload.order !== undefined ? Math.round(Number(payload.order || 0)) : undefined,
      inactive: payload.inactive !== undefined ? Boolean(payload.inactive) : undefined,
      updatedAt: serverTimestamp(),
    })
  );
};

export const deleteEvaluationLevel = async (
  idTenant: string,
  idBranch: string,
  levelId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !levelId) throw new Error("Nível não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "evaluationLevels", levelId);
  await deleteDoc(ref);
};
