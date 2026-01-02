import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  limit,
  where,
  type DocumentData,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import type { EventPlan } from "../eventPlan/eventPlan.types";
import { fetchEventPlans } from "../eventPlan/eventPlan.db";

import { isDateWithinPeriod, normalizeLevelsByTopicId } from "./evaluations.domain";

import type { EvaluationDoc, UpsertEvaluationPayload } from "./evaluations.types";

type EvaluationDocData = Omit<EvaluationDoc, "id"> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

const normalizeEventTypeKey = (value: string): string => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";

  const noAccents = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return noAccents.replace(/[^a-z0-9]+/g, "");
};

const isHardcodedEvaluationType = (eventTypeName: string): boolean => {
  const key = normalizeEventTypeKey(eventTypeName);
  return key.startsWith("avaliacao");
};

const mapEvaluationDoc = (
  id: string,
  raw: DocumentData,
  fallbackTenant: string,
  fallbackBranch: string,
  fallbackClientId: string
): EvaluationDoc => {
  return {
    id,
    idTenant: String(raw?.idTenant || fallbackTenant),
    idBranch: String(raw?.idBranch || fallbackBranch),
    clientId: String(raw?.clientId || fallbackClientId),
    idClass: String(raw?.idClass || ""),
    idActivity: String(raw?.idActivity || ""),
    eventPlanId: String(raw?.eventPlanId || id),
    eventTypeName: String(raw?.eventTypeName || ""),
    startAt: String(raw?.startAt || ""),
    endAt: raw?.endAt ? String(raw.endAt) : undefined,
    levelsByTopicId: (raw?.levelsByTopicId || {}) as any,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    updatedByUserId: raw?.updatedByUserId ? String(raw.updatedByUserId) : undefined,
  };
};

const evaluationsCollection = (db: any, idTenant: string, idBranch: string, clientId: string) =>
  collection(db, "tenants", idTenant, "branches", idBranch, "clients", clientId, "evaluations");

export const fetchEvaluationEventForDate = async (
  idTenant: string,
  idBranch: string,
  dateKey: string
): Promise<EventPlan | null> => {
  if (!idTenant || !idBranch || !dateKey) return null;

  const plans = await fetchEventPlans(idTenant, idBranch);
  const list = Array.isArray(plans) ? plans : [];

  const active = list.find((p) => {
    if (!isHardcodedEvaluationType(String(p?.eventTypeName || ""))) return false;
    return isDateWithinPeriod(dateKey, String(p.startAt || ""), p.endAt);
  });

  return active || null;
};

export const fetchClientEvaluations = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  max: number = 50
): Promise<EvaluationDoc[]> => {
  if (!idTenant || !idBranch || !clientId) return [];
  const db = getFirebaseDb();

  const ref = evaluationsCollection(db, idTenant, idBranch, clientId);
  const q = query(ref, orderBy("updatedAt", "desc"), limit(Math.max(1, Math.min(200, max))));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapEvaluationDoc(d.id, d.data(), idTenant, idBranch, clientId));
};

export const fetchClientEvaluationForEventPlan = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  eventPlanId: string
): Promise<EvaluationDoc | null> => {
  if (!idTenant || !idBranch || !clientId || !eventPlanId) return null;
  const db = getFirebaseDb();

  const ref = doc(evaluationsCollection(db, idTenant, idBranch, clientId), eventPlanId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapEvaluationDoc(snap.id, snap.data(), idTenant, idBranch, clientId);
};

export const hasEvaluationsForEventPlan = async (
  idTenant: string,
  idBranch: string,
  eventPlanId: string
): Promise<boolean> => {
  if (!idTenant || !idBranch || !eventPlanId) return false;

  const db = getFirebaseDb();
  const ref = collectionGroup(db, "evaluations");
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

export const upsertClientEvaluationForEventPlan = async (
  payload: UpsertEvaluationPayload
): Promise<string> => {
  if (!payload.idTenant || !payload.idBranch) throw new Error("Tenant/unidade é obrigatório.");
  if (!payload.clientId) throw new Error("Aluno não identificado.");
  if (!payload.eventPlanId) throw new Error("Período de avaliação não identificado.");

  const db = getFirebaseDb();
  const ref = doc(
    evaluationsCollection(db, payload.idTenant, payload.idBranch, payload.clientId),
    payload.eventPlanId
  );

  const data: EvaluationDocData = {
    idTenant: payload.idTenant,
    idBranch: payload.idBranch,
    clientId: payload.clientId,
    idClass: String(payload.idClass || "").trim(),
    idActivity: String(payload.idActivity || "").trim(),
    eventPlanId: payload.eventPlanId,
    eventTypeName: String(payload.eventTypeName || "").trim(),
    startAt: String(payload.startAt || "").trim(),
    endAt: payload.endAt ? String(payload.endAt).trim() : undefined,
    levelsByTopicId: normalizeLevelsByTopicId(payload.levelsByTopicId || {}),
    updatedByUserId: payload.updatedByUserId ? String(payload.updatedByUserId).trim() : undefined,
    updatedAt: serverTimestamp(),
  };

  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  } else {
    await setDoc(ref, data, { merge: true });
  }

  return ref.id;
};
