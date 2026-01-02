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
  writeBatch,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import type { Activity, ActivityPayload } from "./activities.types";

type ActivityDocData = Omit<Activity, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

const mapActivityDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: ActivityDocData
): Activity => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: String(raw.idBranch || idBranch),
  name: String(raw.name || ""),
  description: raw.description,
  color: String(raw.color || ""),
  status: raw.status === "inactive" ? "inactive" : "active",
  shareWithOtherUnits: Boolean(raw.shareWithOtherUnits),
  photoUrl: raw.photoUrl,
  objectives: [],
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

type ObjectiveDocData = {
  idTenant?: string;
  idBranch?: string;
  activityId?: string;
  title?: string;
  order?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type TopicDocData = {
  idTenant?: string;
  idBranch?: string;
  activityId?: string;
  objectiveId?: string;
  description?: string;
  order?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const normalizeOrder = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getObjectivesCollection = (idTenant: string, idBranch: string, activityId: string) => {
  const db = getFirebaseDb();
  return collection(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "activities",
    activityId,
    "objectives"
  );
};

const getTopicsCollection = (
  idTenant: string,
  idBranch: string,
  activityId: string,
  objectiveId: string
) => {
  const db = getFirebaseDb();
  return collection(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "activities",
    activityId,
    "objectives",
    objectiveId,
    "topics"
  );
};

export const fetchActivityObjectives = async (
  idTenant: string,
  idBranch: string,
  activityId: string
): Promise<Activity["objectives"]> => {
  if (!idTenant || !idBranch || !activityId) return [];

  const objectivesRef = getObjectivesCollection(idTenant, idBranch, activityId);
  const objectivesSnap = await getDocs(query(objectivesRef, orderBy("order", "asc")));

  const objectives = await Promise.all(
    objectivesSnap.docs.map(async (objectiveDoc, index) => {
      const raw = objectiveDoc.data() as ObjectiveDocData;
      const objectiveId = objectiveDoc.id;

      const topicsRef = getTopicsCollection(idTenant, idBranch, activityId, objectiveId);
      const topicsSnap = await getDocs(query(topicsRef, orderBy("order", "asc")));

      const topics = topicsSnap.docs.map((tDoc, tIndex) => {
        const tRaw = tDoc.data() as TopicDocData;
        return {
          id: tDoc.id,
          description: String(tRaw.description || ""),
          order: normalizeOrder(tRaw.order, tIndex),
        };
      });

      return {
        id: objectiveId,
        title: String(raw.title || ""),
        order: normalizeOrder(raw.order, index),
        topics,
      };
    })
  );

  return objectives
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(({ order: _order, topics, ...rest }) => ({
      ...rest,
      topics: topics
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(({ order: _topicOrder, ...t }) => t),
    }));
};

export const syncActivityObjectives = async (
  idTenant: string,
  idBranch: string,
  activityId: string,
  objectives: ActivityPayload["objectives"]
): Promise<void> => {
  if (!idTenant || !idBranch || !activityId) throw new Error("Atividade não identificada.");

  const normalizedObjectives = Array.isArray(objectives) ? objectives : [];
  const db = getFirebaseDb();
  const batch = writeBatch(db);

  const objectivesRef = getObjectivesCollection(idTenant, idBranch, activityId);
  const existingObjectivesSnap = await getDocs(query(objectivesRef));
  const existingObjectiveIds = existingObjectivesSnap.docs.map((d) => d.id);
  const keepObjectiveIds = new Set(
    normalizedObjectives.map((o) => String(o.id || "")).filter(Boolean)
  );

  for (const existingId of existingObjectiveIds) {
    if (!keepObjectiveIds.has(existingId)) {
      const topicsRef = getTopicsCollection(idTenant, idBranch, activityId, existingId);
      const topicsSnap = await getDocs(query(topicsRef));
      topicsSnap.docs.forEach((t) => batch.delete(t.ref));
      batch.delete(
        doc(
          db,
          "tenants",
          idTenant,
          "branches",
          idBranch,
          "activities",
          activityId,
          "objectives",
          existingId
        )
      );
    }
  }

  await Promise.all(
    normalizedObjectives.map(async (objective, objectiveIndex) => {
      const objectiveId = String(objective.id || "").trim();
      if (!objectiveId) return;

      const objectiveDocRef = doc(
        db,
        "tenants",
        idTenant,
        "branches",
        idBranch,
        "activities",
        activityId,
        "objectives",
        objectiveId
      );
      batch.set(
        objectiveDocRef,
        {
          idTenant,
          idBranch,
          activityId,
          title: String(objective.title || "").trim(),
          order: objectiveIndex,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      const topicsRef = getTopicsCollection(idTenant, idBranch, activityId, objectiveId);
      const existingTopicsSnap = await getDocs(query(topicsRef));
      const existingTopicIds = existingTopicsSnap.docs.map((d) => d.id);
      const keepTopicIds = new Set(
        (Array.isArray(objective.topics) ? objective.topics : [])
          .map((t) => String(t.id || "").trim())
          .filter(Boolean)
      );

      for (const existingTopicId of existingTopicIds) {
        if (!keepTopicIds.has(existingTopicId)) {
          batch.delete(
            doc(
              db,
              "tenants",
              idTenant,
              "branches",
              idBranch,
              "activities",
              activityId,
              "objectives",
              objectiveId,
              "topics",
              existingTopicId
            )
          );
        }
      }

      const topics = Array.isArray(objective.topics) ? objective.topics : [];
      topics.forEach((topic, topicIndex) => {
        const topicId = String(topic.id || "").trim();
        if (!topicId) return;

        const topicDocRef = doc(
          db,
          "tenants",
          idTenant,
          "branches",
          idBranch,
          "activities",
          activityId,
          "objectives",
          objectiveId,
          "topics",
          topicId
        );

        batch.set(
          topicDocRef,
          {
            idTenant,
            idBranch,
            activityId,
            objectiveId,
            description: String(topic.description || "").trim(),
            order: topicIndex,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
    })
  );

  await batch.commit();
};

export const fetchActivities = async (idTenant: string, idBranch: string): Promise<Activity[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "activities");
  const snap = await getDocs(query(ref));

  return snap.docs.map((d) =>
    mapActivityDoc(idTenant, idBranch, d.id, d.data() as ActivityDocData)
  );
};

export const fetchActivityById = async (
  idTenant: string,
  idBranch: string,
  activityId: string
): Promise<Activity | null> => {
  if (!idTenant || !idBranch || !activityId) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "activities", activityId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const base = mapActivityDoc(idTenant, idBranch, snap.id, snap.data() as ActivityDocData);
  const objectives = await fetchActivityObjectives(idTenant, idBranch, snap.id);
  return { ...base, objectives };
};

export const createActivity = async (
  idTenant: string,
  idBranch: string,
  payload: ActivityPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "activities"));

  await setDoc(
    ref,
    removeUndefinedFields({
      idTenant,
      idBranch,
      ...payload,
      name: String(payload.name || "").trim(),
      description: payload.description ? String(payload.description).trim() : "",
      color: String(payload.color || "").trim(),
      status: payload.status === "inactive" ? "inactive" : "active",
      shareWithOtherUnits: Boolean(payload.shareWithOtherUnits),
      objectives: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return ref.id;
};

export const updateActivity = async (
  idTenant: string,
  idBranch: string,
  activityId: string,
  payload: Partial<ActivityPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !activityId) throw new Error("Atividade não identificada.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "activities", activityId);

  const updateData = removeUndefinedFields({
    ...payload,
    name: payload.name !== undefined ? String(payload.name).trim() : undefined,
    description: payload.description !== undefined ? String(payload.description).trim() : undefined,
    color: payload.color !== undefined ? String(payload.color).trim() : undefined,
    status: payload.status ? (payload.status === "inactive" ? "inactive" : "active") : undefined,
    shareWithOtherUnits:
      payload.shareWithOtherUnits !== undefined ? Boolean(payload.shareWithOtherUnits) : undefined,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, updateData);
};

export const deleteActivity = async (
  idTenant: string,
  idBranch: string,
  activityId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !activityId) throw new Error("Atividade não identificada.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "activities", activityId);
  await deleteDoc(ref);
};
