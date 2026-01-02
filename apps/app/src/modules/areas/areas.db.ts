import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import type { Area, AreaPayload } from "./areas.types";

type AreaDocData = Omit<Area, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

const mapAreaDoc = (idTenant: string, idBranch: string, id: string, raw: AreaDocData): Area => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: String(raw.idBranch || idBranch),
  name: String(raw.name || ""),
  lengthMeters: Number(raw.lengthMeters || 0),
  widthMeters: Number(raw.widthMeters || 0),
  maxCapacity: Number(raw.maxCapacity || 0),
  inactive: Boolean(raw.inactive),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const fetchAreas = async (idTenant: string, idBranch: string): Promise<Area[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "areas");
  const snap = await getDocs(query(ref));

  return snap.docs.map((d) => mapAreaDoc(idTenant, idBranch, d.id, d.data() as AreaDocData));
};

export const fetchAreaById = async (
  idTenant: string,
  idBranch: string,
  areaId: string
): Promise<Area | null> => {
  if (!idTenant || !idBranch || !areaId) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "areas", areaId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapAreaDoc(idTenant, idBranch, snap.id, snap.data() as AreaDocData);
};

export const createArea = async (
  idTenant: string,
  idBranch: string,
  payload: AreaPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "areas"));

  await setDoc(
    ref,
    removeUndefinedFields({
      idTenant,
      idBranch,
      ...payload,
      name: String(payload.name || "").trim(),
      lengthMeters: Number(payload.lengthMeters || 0),
      widthMeters: Number(payload.widthMeters || 0),
      maxCapacity: Number(payload.maxCapacity || 0),
      inactive: Boolean(payload.inactive),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return ref.id;
};

export const updateArea = async (
  idTenant: string,
  idBranch: string,
  areaId: string,
  payload: Partial<AreaPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !areaId) throw new Error("Área não identificada.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "areas", areaId);

  const updateData = removeUndefinedFields({
    ...payload,
    name: payload.name !== undefined ? String(payload.name).trim() : undefined,
    lengthMeters:
      payload.lengthMeters !== undefined ? Number(payload.lengthMeters || 0) : undefined,
    widthMeters: payload.widthMeters !== undefined ? Number(payload.widthMeters || 0) : undefined,
    maxCapacity: payload.maxCapacity !== undefined ? Number(payload.maxCapacity || 0) : undefined,
    inactive: payload.inactive !== undefined ? Boolean(payload.inactive) : undefined,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, updateData);
};

export const deleteArea = async (
  idTenant: string,
  idBranch: string,
  areaId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !areaId) throw new Error("Área não identificada.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "areas", areaId);
  await deleteDoc(ref);
};
