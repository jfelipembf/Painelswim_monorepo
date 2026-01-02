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

import type { Service, ServicePayload } from "./services.types";

type ServiceDocData = Omit<Service, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

const mapServiceDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: ServiceDocData
): Service => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: String(raw.idBranch || idBranch),
  name: String(raw.name || ""),
  description: raw.description,
  priceCents: Number(raw.priceCents || 0),
  durationMinutes: Number(raw.durationMinutes || 0),
  inactive: Boolean(raw.inactive),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const fetchServices = async (idTenant: string, idBranch: string): Promise<Service[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "services");
  const snap = await getDocs(query(ref));
  return snap.docs.map((d) => mapServiceDoc(idTenant, idBranch, d.id, d.data() as ServiceDocData));
};

export const fetchServiceById = async (
  idTenant: string,
  idBranch: string,
  serviceId: string
): Promise<Service | null> => {
  if (!idTenant || !idBranch || !serviceId) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "services", serviceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapServiceDoc(idTenant, idBranch, snap.id, snap.data() as ServiceDocData);
};

export const createService = async (
  idTenant: string,
  idBranch: string,
  payload: ServicePayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "services"));

  await setDoc(
    ref,
    removeUndefinedFields({
      idTenant,
      idBranch,
      ...payload,
      name: String(payload.name || "").trim(),
      description: payload.description ? String(payload.description).trim() : "",
      priceCents: Math.round(Number(payload.priceCents || 0)),
      durationMinutes: Math.round(Number(payload.durationMinutes || 0)),
      inactive: Boolean(payload.inactive),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return ref.id;
};

export const updateService = async (
  idTenant: string,
  idBranch: string,
  serviceId: string,
  payload: Partial<ServicePayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !serviceId) throw new Error("Serviço não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "services", serviceId);

  const updateData = removeUndefinedFields({
    ...payload,
    name: payload.name !== undefined ? String(payload.name).trim() : undefined,
    description: payload.description !== undefined ? String(payload.description).trim() : undefined,
    priceCents:
      payload.priceCents !== undefined ? Math.round(Number(payload.priceCents || 0)) : undefined,
    durationMinutes:
      payload.durationMinutes !== undefined
        ? Math.round(Number(payload.durationMinutes || 0))
        : undefined,
    inactive: payload.inactive !== undefined ? Boolean(payload.inactive) : undefined,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, updateData);
};

export const deleteService = async (
  idTenant: string,
  idBranch: string,
  serviceId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !serviceId) throw new Error("Serviço não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "services", serviceId);
  await deleteDoc(ref);
};
