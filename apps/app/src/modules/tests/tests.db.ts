import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  limit,
  where,
  type DocumentData,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import { fetchEventPlans } from "../eventPlan/eventPlan.db";
import type { EventPlan } from "../eventPlan/eventPlan.types";

import { normalizeEventTypeKey } from "../../constants/eventPlanTypes";

import type {
  ClientTestResultDoc,
  TestDefinition,
  TestDefinitionPayload,
  TestResultValue,
  UpsertClientTestResultPayload,
} from "./tests.types";

type TestDefinitionDocData = Omit<TestDefinition, "id"> & {
  idTenant?: string;
  idBranch?: string;
};

type ClientTestResultDocData = Omit<ClientTestResultDoc, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

const toDateOnly = (value: string): string => String(value || "").slice(0, 10);

const isDateWithinPeriod = (dateKey: string, startAt: string, endAt?: string): boolean => {
  const d = toDateOnly(dateKey);
  const start = toDateOnly(startAt);
  const end = endAt ? toDateOnly(endAt) : "";
  if (!d || !start) return false;
  if (d < start) return false;
  if (end && d > end) return false;
  return true;
};

const isHardcodedTestsType = (eventTypeName: string): boolean => {
  const key = normalizeEventTypeKey(eventTypeName);
  return key.startsWith("testes");
};

const mapTestDefinitionDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: TestDefinitionDocData
): TestDefinition => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: String(raw.idBranch || idBranch),
  mode: raw.mode === "time" ? "time" : "distance",
  name: String(raw.name || ""),
  fixedDistanceMeters:
    typeof raw.fixedDistanceMeters === "number" && !Number.isNaN(raw.fixedDistanceMeters)
      ? raw.fixedDistanceMeters
      : undefined,
  fixedTimeSeconds:
    typeof raw.fixedTimeSeconds === "number" && !Number.isNaN(raw.fixedTimeSeconds)
      ? raw.fixedTimeSeconds
      : undefined,
  inactive: Boolean(raw.inactive),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const mapClientTestResultDoc = (
  idTenant: string,
  idBranch: string,
  clientId: string,
  id: string,
  raw: ClientTestResultDocData
): ClientTestResultDoc => {
  return {
    id,
    idTenant: String(raw?.idTenant || idTenant),
    idBranch: String(raw?.idBranch || idBranch),
    clientId: String(raw?.clientId || clientId),
    eventPlanId: String(raw?.eventPlanId || id),
    eventTypeName: String(raw?.eventTypeName || ""),
    startAt: String(raw?.startAt || ""),
    endAt: raw?.endAt ? String(raw.endAt) : undefined,
    resultsByTestId: (raw?.resultsByTestId || {}) as Record<string, TestResultValue>,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    updatedByUserId: raw?.updatedByUserId ? String(raw.updatedByUserId) : undefined,
  };
};

const clientTestsCollection = (db: any, idTenant: string, idBranch: string, clientId: string) =>
  collection(db, "tenants", idTenant, "branches", idBranch, "clients", clientId, "tests");

export const fetchTestDefinitions = async (
  idTenant: string,
  idBranch: string
): Promise<TestDefinition[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "testDefinitions");
  const snap = await getDocs(query(ref, orderBy("name", "asc")));
  return snap.docs.map((docSnap) =>
    mapTestDefinitionDoc(idTenant, idBranch, docSnap.id, docSnap.data() as TestDefinitionDocData)
  );
};

export const createTestDefinition = async (
  idTenant: string,
  idBranch: string,
  payload: TestDefinitionPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "testDefinitions"));

  await setDoc(
    ref,
    removeUndefinedFields({
      idTenant,
      idBranch,
      ...payload,
      mode: payload.mode === "time" ? "time" : "distance",
      name: String(payload.name || "").trim(),
      fixedDistanceMeters:
        payload.fixedDistanceMeters !== undefined ? Number(payload.fixedDistanceMeters) : undefined,
      fixedTimeSeconds:
        payload.fixedTimeSeconds !== undefined ? Number(payload.fixedTimeSeconds) : undefined,
      inactive: Boolean(payload.inactive),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return ref.id;
};

export const updateTestDefinition = async (
  idTenant: string,
  idBranch: string,
  testDefinitionId: string,
  payload: Partial<TestDefinitionPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !testDefinitionId) throw new Error("Teste não identificado.");

  const db = getFirebaseDb();
  const ref = doc(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "testDefinitions",
    testDefinitionId
  );

  await updateDoc(
    ref,
    removeUndefinedFields({
      ...payload,
      name: payload.name !== undefined ? String(payload.name).trim() : undefined,
      mode:
        payload.mode !== undefined ? (payload.mode === "time" ? "time" : "distance") : undefined,
      fixedDistanceMeters:
        payload.fixedDistanceMeters !== undefined ? Number(payload.fixedDistanceMeters) : undefined,
      fixedTimeSeconds:
        payload.fixedTimeSeconds !== undefined ? Number(payload.fixedTimeSeconds) : undefined,
      inactive: payload.inactive !== undefined ? Boolean(payload.inactive) : undefined,
      updatedAt: serverTimestamp(),
    })
  );
};

export const deleteTestDefinition = async (
  idTenant: string,
  idBranch: string,
  testDefinitionId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !testDefinitionId) throw new Error("Teste não identificado.");

  const db = getFirebaseDb();
  const ref = doc(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "testDefinitions",
    testDefinitionId
  );
  await deleteDoc(ref);
};

export const fetchTestsEventForDate = async (
  idTenant: string,
  idBranch: string,
  dateKey: string
): Promise<EventPlan | null> => {
  if (!idTenant || !idBranch || !dateKey) return null;
  const plans = await fetchEventPlans(idTenant, idBranch);
  const list = Array.isArray(plans) ? plans : [];
  const active = list.find((p) => {
    if (!isHardcodedTestsType(String(p?.eventTypeName || ""))) return false;
    return isDateWithinPeriod(dateKey, String(p.startAt || ""), p.endAt);
  });
  return active || null;
};

export const fetchClientTestResults = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  max: number = 50
): Promise<ClientTestResultDoc[]> => {
  if (!idTenant || !idBranch || !clientId) return [];
  const db = getFirebaseDb();
  const ref = clientTestsCollection(db, idTenant, idBranch, clientId);
  const q = query(ref, orderBy("updatedAt", "desc"), limit(Math.max(1, Math.min(200, max))));
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    mapClientTestResultDoc(idTenant, idBranch, clientId, d.id, d.data() as ClientTestResultDocData)
  );
};

export const fetchClientTestResultForEventPlan = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  eventPlanId: string
): Promise<ClientTestResultDoc | null> => {
  if (!idTenant || !idBranch || !clientId || !eventPlanId) return null;
  const db = getFirebaseDb();
  const ref = doc(clientTestsCollection(db, idTenant, idBranch, clientId), eventPlanId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapClientTestResultDoc(
    idTenant,
    idBranch,
    clientId,
    snap.id,
    snap.data() as ClientTestResultDocData
  );
};

export const hasTestResultsForEventPlan = async (
  idTenant: string,
  idBranch: string,
  eventPlanId: string
): Promise<boolean> => {
  if (!idTenant || !idBranch || !eventPlanId) return false;

  const db = getFirebaseDb();
  const ref = collectionGroup(db, "tests");
  const q = query(ref, where("eventPlanId", "==", eventPlanId), limit(25));
  const snap = await getDocs(q);
  if (snap.empty) return false;

  return snap.docs.some((docSnap) => {
    const data = docSnap.data() as DocumentData;
    return (
      String(data?.idTenant || "") === String(idTenant) &&
      String(data?.idBranch || "") === String(idBranch)
    );
  });
};

export const upsertClientTestResultForEventPlan = async (
  payload: UpsertClientTestResultPayload
): Promise<string> => {
  if (!payload.idTenant || !payload.idBranch) throw new Error("Tenant/unidade é obrigatório.");
  if (!payload.clientId) throw new Error("Aluno não identificado.");
  if (!payload.eventPlanId) throw new Error("Período de testes não identificado.");

  const db = getFirebaseDb();
  const ref = doc(
    clientTestsCollection(db, payload.idTenant, payload.idBranch, payload.clientId),
    payload.eventPlanId
  );

  const sanitizedResults: Record<string, TestResultValue> = {};
  Object.entries(payload.resultsByTestId || {}).forEach(([testId, v]) => {
    const tid = String(testId || "").trim();
    if (!tid) return;
    const value = String((v as any)?.value || "");
    sanitizedResults[tid] = { value };
  });

  const data: ClientTestResultDocData = {
    idTenant: payload.idTenant,
    idBranch: payload.idBranch,
    clientId: payload.clientId,
    eventPlanId: payload.eventPlanId,
    eventTypeName: String(payload.eventTypeName || "").trim(),
    startAt: String(payload.startAt || "").trim(),
    endAt: payload.endAt ? String(payload.endAt).trim() : undefined,
    resultsByTestId: sanitizedResults,
    updatedByUserId: payload.updatedByUserId ? String(payload.updatedByUserId).trim() : undefined,
    updatedAt: serverTimestamp(),
  };

  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, removeUndefinedFields({ ...data, createdAt: serverTimestamp() }) as any);
  } else {
    await setDoc(ref, removeUndefinedFields(data) as any, { merge: true });
  }

  return ref.id;
};
