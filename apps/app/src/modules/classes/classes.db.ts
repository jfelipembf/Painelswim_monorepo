import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  increment,
  limit,
  serverTimestamp,
  writeBatch,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import type { ClassDoc, ClassPayload, ClassSessionDoc } from "./classes.types";

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

type ClassDocData = Omit<ClassDoc, "id"> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

type SessionDocData = Omit<ClassSessionDoc, "id"> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

const mapClassDoc = (
  id: string,
  raw: DocumentData,
  fallbackTenant: string,
  fallbackBranch: string
): ClassDoc => {
  return {
    id,
    idTenant: String(raw?.idTenant || fallbackTenant),
    idBranch: String(raw?.idBranch || fallbackBranch),
    idActivity: String(raw?.idActivity || ""),
    idArea: String(raw?.idArea || ""),
    idEmployee: String(raw?.idEmployee || ""),
    weekday: Number(raw?.weekday || 0) as any,
    startDate: String(raw?.startDate || ""),
    endDate: raw?.endDate ? String(raw.endDate) : undefined,
    startTime: String(raw?.startTime || ""),
    endTime: String(raw?.endTime || ""),
    durationMinutes: Number(raw?.durationMinutes || 0),
    maxCapacity: Number(raw?.maxCapacity || 0),
    enrolledCount: Number(raw?.enrolledCount || 0),
    status: raw?.status === "inactive" ? "inactive" : "active",
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
};

export const createClass = async (payload: ClassPayload): Promise<string> => {
  const db = getFirebaseDb();
  const ref = doc(
    collection(db, "tenants", payload.idTenant, "branches", payload.idBranch, "classes")
  );

  const data: ClassDocData = {
    ...payload,
    idTenant: payload.idTenant,
    idBranch: payload.idBranch,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, removeUndefinedFields(data) as ClassDocData);
  return ref.id;
};

export const updateClass = async (
  idTenant: string,
  idBranch: string,
  idClass: string,
  payload: ClassPayload
): Promise<void> => {
  if (!idTenant || !idBranch || !idClass) throw new Error("Turma não identificada.");
  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "classes", idClass);

  if (payload.endDate) {
    const hasActiveEnrollmentsQuery = query(
      collectionGroup(db, "enrollments"),
      where("idTenant", "==", idTenant),
      where("idBranch", "==", idBranch),
      where("idClass", "==", idClass),
      where("status", "==", "active"),
      limit(1)
    );
    const activeEnrollmentsSnap = await getDocs(hasActiveEnrollmentsQuery);
    if (!activeEnrollmentsSnap.empty) {
      throw new Error(
        "Existem alunos matriculados nesta turma. Antes de informar uma data fim, remova as matrículas."
      );
    }
  }

  const data: ClassDocData = {
    ...payload,
    idTenant,
    idBranch,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, removeUndefinedFields(data) as ClassDocData, { merge: true });
};

export const deleteClass = async (
  idTenant: string,
  idBranch: string,
  idClass: string
): Promise<void> => {
  if (!idTenant || !idBranch || !idClass) throw new Error("Turma não identificada.");
  const db = getFirebaseDb();

  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "classes", idClass);
  const classSnap = await getDoc(ref);
  if (!classSnap.exists()) throw new Error("Turma não encontrada.");

  const rawClass = classSnap.data() as any;
  const enrolledCount = Number(rawClass?.enrolledCount || 0);
  if (Number.isFinite(enrolledCount) && enrolledCount > 0) {
    throw new Error("Não é possível excluir a turma: existe aluno matriculado nesta turma.");
  }

  const hasActiveEnrollmentsQuery = query(
    collectionGroup(db, "enrollments"),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("idClass", "==", idClass),
    where("status", "==", "active"),
    limit(1)
  );
  const activeEnrollmentsSnap = await getDocs(hasActiveEnrollmentsQuery);
  if (!activeEnrollmentsSnap.empty) {
    throw new Error("Não é possível excluir a turma: existe aluno matriculado nesta turma.");
  }

  const hasAnyEnrollmentsQuery = query(
    collectionGroup(db, "enrollments"),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("idClass", "==", idClass),
    limit(1)
  );
  const anyEnrollmentsSnap = await getDocs(hasAnyEnrollmentsQuery);
  if (!anyEnrollmentsSnap.empty) {
    throw new Error(
      "Não é possível excluir a turma: existem registros de alunos matriculados nesta turma."
    );
  }

  const classEndDate = rawClass?.endDate ? String(rawClass.endDate).slice(0, 10) : "";
  const isRecurring = !classEndDate;

  const deletionDateKey = String(new Date().toISOString()).slice(0, 10);

  if (isRecurring) {
    const sessionsRef = collection(db, "tenants", idTenant, "branches", idBranch, "classSessions");
    const sessionsQuery = query(sessionsRef, where("idClass", "==", idClass));
    const sessionsSnap = await getDocs(sessionsQuery);

    const futureSessionDocs = sessionsSnap.docs.filter((d) => {
      const raw = d.data() as any;
      const sessionDate = String(raw?.sessionDate || "").slice(0, 10);
      return sessionDate && sessionDate >= deletionDateKey;
    });

    for (let i = 0; i < futureSessionDocs.length; i += 450) {
      const batch = writeBatch(db);
      futureSessionDocs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  const yesterday = new Date(`${deletionDateKey}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yKey = String(yesterday.toISOString()).slice(0, 10);
  await setDoc(
    ref,
    {
      idTenant,
      idBranch,
      status: "inactive",
      endDate: yKey,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const incrementClassEnrolledCount = async (
  idTenant: string,
  idBranch: string,
  idClass: string,
  delta: number
): Promise<void> => {
  if (!idTenant || !idBranch || !idClass) throw new Error("Turma não identificada.");
  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "classes", idClass);
  await setDoc(
    ref,
    {
      idTenant,
      idBranch,
      enrolledCount: increment(Number(delta || 0)),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

const toDateOnly = (value: string): string => String(value || "").slice(0, 10);

const parseIsoDate = (value: string): Date | null => {
  const k = toDateOnly(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return null;
  const d = new Date(`${k}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) ? d : null;
};

const formatIsoDate = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, days: number): Date => {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
};

export const deleteBranchSessionsForClassInRange = async (
  idTenant: string,
  idBranch: string,
  idClass: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  if (!idTenant || !idBranch || !idClass) return;
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end < start) return;

  const db = getFirebaseDb();
  const sessionIds: string[] = [];

  let cursor = start;
  while (cursor <= end) {
    const iso = formatIsoDate(cursor);
    sessionIds.push(`${idClass}_${iso}`);
    cursor = addDays(cursor, 1);
  }

  const sessionsPath = (id: string) =>
    doc(db, "tenants", idTenant, "branches", idBranch, "classSessions", id);

  for (let i = 0; i < sessionIds.length; i += 450) {
    const batch = writeBatch(db);
    sessionIds.slice(i, i + 450).forEach((sid) => batch.delete(sessionsPath(sid)));
    await batch.commit();
  }
};

export const fetchClasses = async (idTenant: string, idBranch: string): Promise<ClassDoc[]> => {
  if (!idTenant || !idBranch) return [];
  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "classes");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => mapClassDoc(d.id, d.data(), idTenant, idBranch));
};

export const fetchBranchSessionsInRange = async (
  idTenant: string,
  idBranch: string,
  startDate: string,
  endDate: string
): Promise<ClassSessionDoc[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const sessionsRef = collection(db, "tenants", idTenant, "branches", idBranch, "classSessions");
  const q = query(
    sessionsRef,
    where("sessionDate", ">=", String(startDate).slice(0, 10)),
    where("sessionDate", "<=", String(endDate).slice(0, 10))
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const raw = d.data() as SessionDocData;
    const rawEnrolledCount = (raw as { enrolledCount?: unknown })?.enrolledCount;
    const enrolledCount =
      typeof rawEnrolledCount === "number"
        ? rawEnrolledCount
        : rawEnrolledCount === undefined
        ? undefined
        : Number(rawEnrolledCount);
    return {
      id: d.id,
      idTenant: String(raw.idTenant || idTenant),
      idBranch: String(raw.idBranch || idBranch),
      idClass: String(raw.idClass || ""),
      idActivity: String(raw.idActivity || ""),
      idArea: String(raw.idArea || ""),
      idEmployee: String(raw.idEmployee || ""),
      sessionDate: String(raw.sessionDate || ""),
      startTime: String(raw.startTime || ""),
      endTime: String(raw.endTime || ""),
      durationMinutes: Number(raw.durationMinutes || 0),
      maxCapacity: Number(raw.maxCapacity || 0),
      enrolledCount: Number.isFinite(enrolledCount) ? enrolledCount : undefined,
      status: (raw.status as any) || "scheduled",
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  });
};
