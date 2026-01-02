import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  query,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import { incrementClassEnrolledCount } from "../classes/classes.db";

import type { EnrollmentDoc, EnrollmentPayload } from "./enrollments.types";

type EnrollmentDocData = Omit<EnrollmentDoc, "id"> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

const mapEnrollmentDoc = (
  snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>,
  fallbackTenant: string,
  fallbackBranch: string,
  fallbackClientId: string
): EnrollmentDoc => {
  const raw = snapshot.data() as EnrollmentDocData;
  return {
    id: snapshot.id,
    idTenant: String(raw?.idTenant || fallbackTenant),
    idBranch: String(raw?.idBranch || fallbackBranch),
    clientId: String(raw?.clientId || fallbackClientId),
    idClass: String(raw?.idClass || ""),
    status: raw?.status === "inactive" ? "inactive" : "active",
    effectiveFrom: String(raw?.effectiveFrom || ""),
    effectiveTo: raw?.effectiveTo ? String(raw.effectiveTo) : undefined,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
};

const enrollmentsCollection = (db: any, idTenant: string, idBranch: string, clientId: string) =>
  collection(db, "tenants", idTenant, "branches", idBranch, "clients", clientId, "enrollments");

export const createEnrollment = async (payload: EnrollmentPayload): Promise<string> => {
  const db = getFirebaseDb();
  const ref = doc(enrollmentsCollection(db, payload.idTenant, payload.idBranch, payload.clientId));

  const data: EnrollmentDocData = {
    ...payload,
    idTenant: payload.idTenant,
    idBranch: payload.idBranch,
    clientId: payload.clientId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (payload.status !== "inactive" && payload.idClass) {
    const classRef = doc(
      db,
      "tenants",
      payload.idTenant,
      "branches",
      payload.idBranch,
      "classes",
      payload.idClass
    );

    await runTransaction(db, async (tx) => {
      const classSnap = await tx.get(classRef);
      if (!classSnap.exists()) throw new Error("Turma não encontrada.");

      const raw = classSnap.data() as any;
      const enrolledCount = Number(raw?.enrolledCount || 0);

      tx.set(ref, data);
      tx.set(
        classRef,
        {
          idTenant: payload.idTenant,
          idBranch: payload.idBranch,
          enrolledCount: enrolledCount + 1,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  } else {
    await setDoc(ref, data);
  }

  return ref.id;
};

export const fetchClientEnrollments = async (
  idTenant: string,
  idBranch: string,
  clientId: string
): Promise<EnrollmentDoc[]> => {
  if (!idTenant || !idBranch || !clientId) return [];
  const db = getFirebaseDb();

  const ref = enrollmentsCollection(db, idTenant, idBranch, clientId);
  const snap = await getDocs(ref);
  return snap.docs.map((d) => mapEnrollmentDoc(d, idTenant, idBranch, clientId));
};

export const fetchActiveEnrollmentsForClass = async (
  idTenant: string,
  idBranch: string,
  idClass: string
): Promise<EnrollmentDoc[]> => {
  if (!idTenant || !idBranch || !idClass) return [];
  const db = getFirebaseDb();

  const q = query(
    collectionGroup(db, "enrollments"),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("idClass", "==", idClass),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const raw = d.data() as EnrollmentDocData;
    return {
      id: d.id,
      idTenant: String(raw?.idTenant || idTenant),
      idBranch: String(raw?.idBranch || idBranch),
      clientId: String(raw?.clientId || ""),
      idClass: String(raw?.idClass || idClass),
      status: raw?.status === "inactive" ? "inactive" : "active",
      effectiveFrom: String(raw?.effectiveFrom || ""),
      effectiveTo: raw?.effectiveTo ? String(raw.effectiveTo) : undefined,
      createdAt: raw?.createdAt,
      updatedAt: raw?.updatedAt,
    };
  });
};

export const fetchBranchEnrollmentsInRange = async (
  idTenant: string,
  idBranch: string,
  startDate: string,
  endDate: string
): Promise<EnrollmentDoc[]> => {
  if (!idTenant || !idBranch || !startDate || !endDate) return [];
  const db = getFirebaseDb();
  const endKey = String(endDate || "").slice(0, 10);

  const q = query(
    collectionGroup(db, "enrollments"),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("effectiveFrom", "<=", endKey)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data() as EnrollmentDocData;
    const clientId = String(raw?.clientId || "");
    return mapEnrollmentDoc(d, idTenant, idBranch, clientId);
  });
};

export const deactivateEnrollmentFromDate = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  enrollmentId: string,
  effectiveTo: string
): Promise<void> => {
  if (!idTenant || !idBranch || !clientId || !enrollmentId)
    throw new Error("Matrícula não identificada.");
  const db = getFirebaseDb();

  const ref = doc(enrollmentsCollection(db, idTenant, idBranch, clientId), enrollmentId);
  const snap = await getDoc(ref);
  const previous = snap.exists() ? (snap.data() as EnrollmentDocData) : null;

  await setDoc(
    ref,
    {
      status: "inactive",
      effectiveTo: String(effectiveTo).slice(0, 10),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const wasActive = previous?.status !== "inactive";
  const idClass = String(previous?.idClass || "");
  if (wasActive && idClass) {
    await incrementClassEnrolledCount(idTenant, idBranch, idClass, -1);
  }
};

export const deactivateClientEnrollmentsFromDate = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  effectiveTo: string
): Promise<void> => {
  if (!idTenant || !idBranch || !clientId) return;
  const dateKey = String(effectiveTo).slice(0, 10);
  const list = await fetchClientEnrollments(idTenant, idBranch, clientId);
  const actives = list.filter((e) => e.status === "active");
  for (const e of actives) {
    await deactivateEnrollmentFromDate(idTenant, idBranch, clientId, e.id, dateKey);
  }
};

export const findActiveEnrollmentForClientAndClass = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  idClass: string
): Promise<EnrollmentDoc | null> => {
  if (!idTenant || !idBranch || !clientId || !idClass) return null;
  const db = getFirebaseDb();

  const ref = enrollmentsCollection(db, idTenant, idBranch, clientId);
  const q = query(ref, where("idClass", "==", idClass), where("status", "==", "active"));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? mapEnrollmentDoc(first, idTenant, idBranch, clientId) : null;
};
