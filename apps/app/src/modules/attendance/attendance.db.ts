import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import { mapAttendanceDoc, normalizeAttendancePayload } from "./attendance.domain";

import type { AttendanceEntry, AttendanceUpsertPayload } from "./attendance.types";

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

type AttendanceDocData = Omit<AttendanceEntry, "id"> & {
  createdAt?: unknown;
  updatedAt?: unknown;
  markedAt?: unknown;
};

const attendanceCollection = (db: any, idTenant: string, idBranch: string, sessionId: string) =>
  collection(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "classSessions",
    sessionId,
    "attendance"
  );

export const upsertAttendance = async (payload: AttendanceUpsertPayload): Promise<void> => {
  const normalized = normalizeAttendancePayload(payload);
  if (!normalized.idTenant || !normalized.idBranch)
    throw new Error("Academia/unidade não identificadas.");
  if (!normalized.sessionId) throw new Error("Sessão não identificada.");
  if (!normalized.clientId) throw new Error("Aluno não identificado.");

  console.info("[Attendance] upsert", {
    sessionId: normalized.sessionId,
    clientId: normalized.clientId,
    status: normalized.status,
    sessionDateKey: normalized.sessionDateKey,
    sessionStartTime: normalized.sessionStartTime,
  });

  const db = getFirebaseDb();
  const ref = doc(
    attendanceCollection(db, normalized.idTenant, normalized.idBranch, normalized.sessionId),
    normalized.clientId
  );

  const data: AttendanceDocData = {
    idTenant: normalized.idTenant,
    idBranch: normalized.idBranch,
    sessionId: normalized.sessionId,
    idClass: normalized.idClass,
    sessionDateKey: normalized.sessionDateKey,
    sessionStartTime: normalized.sessionStartTime,
    clientId: normalized.clientId,
    status: normalized.status,
    justification: normalized.justification ? String(normalized.justification) : "",
    studentName: normalized.studentName,
    photoUrl: normalized.photoUrl ?? null,
    markedByUserId: normalized.markedByUserId ? String(normalized.markedByUserId) : undefined,
    markedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, removeUndefinedFields(data) as AttendanceDocData, { merge: true });
};

export const fetchAttendanceForSession = async (
  idTenant: string,
  idBranch: string,
  sessionId: string
): Promise<AttendanceEntry[]> => {
  if (!idTenant || !idBranch || !sessionId) return [];
  const db = getFirebaseDb();
  const snap = await getDocs(attendanceCollection(db, idTenant, idBranch, sessionId));
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData, DocumentData>) =>
    mapAttendanceDoc(d.id, d.data() as any, {
      idTenant,
      idBranch,
      sessionId,
      idClass: String((d.data() as any)?.idClass || ""),
      clientId: d.id,
    })
  );
};

export const fetchAttendanceForSessionByClass = async (
  idTenant: string,
  idBranch: string,
  sessionId: string,
  idClass: string
): Promise<AttendanceEntry[]> => {
  if (!idTenant || !idBranch || !sessionId || !idClass) return [];
  const db = getFirebaseDb();
  const q = query(
    attendanceCollection(db, idTenant, idBranch, sessionId),
    where("idClass", "==", idClass)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData, DocumentData>) =>
    mapAttendanceDoc(d.id, d.data() as any, {
      idTenant,
      idBranch,
      sessionId,
      idClass,
      clientId: d.id,
    })
  );
};

export const fetchAttendanceForStudentInSession = async (
  idTenant: string,
  idBranch: string,
  sessionId: string,
  clientId: string
): Promise<AttendanceEntry | null> => {
  if (!idTenant || !idBranch || !sessionId || !clientId) return null;
  const db = getFirebaseDb();
  const ref = doc(attendanceCollection(db, idTenant, idBranch, sessionId), clientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapAttendanceDoc(snap.id, snap.data() as any, {
    idTenant,
    idBranch,
    sessionId,
    idClass: String((snap.data() as any)?.idClass || ""),
    clientId,
  });
};
