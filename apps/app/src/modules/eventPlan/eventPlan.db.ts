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
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import type { EventPlan, EventPlanPayload, EventType, EventTypePayload } from "./eventPlan.types";

type EventTypeDocData = Omit<EventType, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type EventPlanDocData = Omit<EventPlan, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

const mapEventTypeDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: EventTypeDocData
): EventType => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: String(raw.idBranch || idBranch),
  name: String(raw.name || ""),
  className: String(raw.className || "info"),
  inactive: Boolean(raw.inactive),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const mapEventPlanDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: EventPlanDocData
): EventPlan => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: String(raw.idBranch || idBranch),
  eventTypeId: String(raw.eventTypeId || ""),
  eventTypeName: String(raw.eventTypeName || ""),
  className: String(raw.className || "info"),
  startAt: String(raw.startAt || ""),
  endAt: raw.endAt,
  allDay: Boolean(raw.allDay),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const fetchEventTypes = async (idTenant: string, idBranch: string): Promise<EventType[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "eventTypes");
  const snap = await getDocs(query(ref, orderBy("name", "asc")));
  return snap.docs.map((d) =>
    mapEventTypeDoc(idTenant, idBranch, d.id, d.data() as EventTypeDocData)
  );
};

export const fetchEventTypeById = async (
  idTenant: string,
  idBranch: string,
  eventTypeId: string
): Promise<EventType | null> => {
  if (!idTenant || !idBranch || !eventTypeId) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "eventTypes", eventTypeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapEventTypeDoc(idTenant, idBranch, snap.id, snap.data() as EventTypeDocData);
};

export const createEventType = async (
  idTenant: string,
  idBranch: string,
  payload: EventTypePayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "eventTypes"));

  await setDoc(
    ref,
    removeUndefinedFields({
      idTenant,
      idBranch,
      ...payload,
      name: String(payload.name || "").trim(),
      className: String(payload.className || "info").trim() || "info",
      inactive: Boolean(payload.inactive),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return ref.id;
};

export const updateEventType = async (
  idTenant: string,
  idBranch: string,
  eventTypeId: string,
  payload: Partial<EventTypePayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !eventTypeId) throw new Error("Tipo de evento não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "eventTypes", eventTypeId);

  const updateData = removeUndefinedFields({
    ...payload,
    name: payload.name !== undefined ? String(payload.name).trim() : undefined,
    className: payload.className !== undefined ? String(payload.className).trim() : undefined,
    inactive: payload.inactive !== undefined ? Boolean(payload.inactive) : undefined,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, updateData);
};

export const deleteEventType = async (
  idTenant: string,
  idBranch: string,
  eventTypeId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !eventTypeId) throw new Error("Tipo de evento não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "eventTypes", eventTypeId);
  await deleteDoc(ref);
};

export const fetchEventPlans = async (idTenant: string, idBranch: string): Promise<EventPlan[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "eventPlans");
  const snap = await getDocs(query(ref, orderBy("startAt", "desc")));
  return snap.docs.map((d) =>
    mapEventPlanDoc(idTenant, idBranch, d.id, d.data() as EventPlanDocData)
  );
};

export const fetchEventPlanById = async (
  idTenant: string,
  idBranch: string,
  eventPlanId: string
): Promise<EventPlan | null> => {
  if (!idTenant || !idBranch || !eventPlanId) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "eventPlans", eventPlanId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapEventPlanDoc(idTenant, idBranch, snap.id, snap.data() as EventPlanDocData);
};

export const createEventPlan = async (
  idTenant: string,
  idBranch: string,
  payload: EventPlanPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "eventPlans"));

  await setDoc(
    ref,
    removeUndefinedFields({
      idTenant,
      idBranch,
      ...payload,
      eventTypeId: String(payload.eventTypeId || "").trim(),
      eventTypeName: String(payload.eventTypeName || "").trim(),
      className: String(payload.className || "info").trim() || "info",
      startAt: String(payload.startAt || "").trim(),
      endAt: payload.endAt ? String(payload.endAt).trim() : undefined,
      allDay: Boolean(payload.allDay),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return ref.id;
};

export const updateEventPlan = async (
  idTenant: string,
  idBranch: string,
  eventPlanId: string,
  payload: Partial<EventPlanPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !eventPlanId) throw new Error("Evento não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "eventPlans", eventPlanId);

  const updateData = removeUndefinedFields({
    ...payload,
    idBranch: payload.idBranch !== undefined ? String(payload.idBranch).trim() : undefined,
    eventTypeId: payload.eventTypeId !== undefined ? String(payload.eventTypeId).trim() : undefined,
    eventTypeName:
      payload.eventTypeName !== undefined ? String(payload.eventTypeName).trim() : undefined,
    className: payload.className !== undefined ? String(payload.className).trim() : undefined,
    startAt: payload.startAt !== undefined ? String(payload.startAt).trim() : undefined,
    endAt:
      payload.endAt !== undefined ? (payload.endAt ? String(payload.endAt).trim() : "") : undefined,
    allDay: payload.allDay !== undefined ? Boolean(payload.allDay) : undefined,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, updateData);
};

export const deleteEventPlan = async (
  idTenant: string,
  idBranch: string,
  eventPlanId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !eventPlanId) throw new Error("Evento não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "eventPlans", eventPlanId);
  await deleteDoc(ref);
};
