import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

import {
  BulkWriterErrorLike,
  isValidDateKey,
  shouldRetryBulkWriter,
  toDateKey,
  toDateKeyFromValue,
} from "../shared";

type EnrollmentWriteEvent = {
  params: {
    idTenant?: string;
    idBranch?: string;
  };
  data?: {
    before: admin.firestore.DocumentSnapshot;
    after: admin.firestore.DocumentSnapshot;
  };
};

type SessionDocData = {
  idClass?: unknown;
  sessionDate?: unknown;
};

type EnrollmentDocData = {
  effectiveFrom?: unknown;
  effectiveTo?: unknown;
  startDate?: unknown;
  createdAt?: unknown;
};

type EnrollmentRange = {
  idClass: string;
  startKey: string;
  endKey?: string;
};

const normalizeRange = (data?: admin.firestore.DocumentData): EnrollmentRange | null => {
  if (!data) return null;
  if (String(data?.status || "") !== "active") return null;

  const idClass = String(data?.idClass || "");
  if (!idClass) return null;

  const startKey = toDateKeyFromValue(data?.effectiveFrom || data?.startDate || data?.createdAt);
  if (!isValidDateKey(startKey)) return null;

  const rawEnd = toDateKeyFromValue(data?.effectiveTo);
  const endKey = isValidDateKey(rawEnd) ? rawEnd : "";
  if (endKey && endKey < startKey) return null;

  return {
    idClass,
    startKey,
    endKey: endKey || undefined,
  };
};

const isSameRange = (a: EnrollmentRange | null, b: EnrollmentRange | null): boolean => {
  if (!a || !b) return false;
  return (
    a.idClass === b.idClass &&
    a.startKey === b.startKey &&
    String(a.endKey || "") === String(b.endKey || "")
  );
};

const updateSessionCountsForRange = async (
  db: admin.firestore.Firestore,
  idTenant: string,
  idBranch: string,
  range: EnrollmentRange | null,
  delta: number
): Promise<number> => {
  if (!range || !delta || !idTenant || !idBranch) return 0;

  const sessionsRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("classSessions");

  const snap = await sessionsRef.where("idClass", "==", range.idClass).get();
  if (snap.empty) return 0;

  const writer = db.bulkWriter();
  writer.onWriteError((error: BulkWriterErrorLike) => shouldRetryBulkWriter(error));

  snap.docs.forEach((doc) => {
    const data = doc.data() as { sessionDate?: unknown };
    const sessionDate = toDateKeyFromValue(data?.sessionDate);
    if (!isValidDateKey(sessionDate)) return;
    if (sessionDate < range.startKey) return;
    if (range.endKey && sessionDate > range.endKey) return;

    writer.set(
      doc.ref,
      {
        enrolledCount: FieldValue.increment(Number(delta)),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await writer.close();
  return snap.size;
};

const countActiveEnrollmentsForClass = async (
  idTenant: string,
  idBranch: string,
  idClass: string,
  dateKey: string
): Promise<number> => {
  const db = admin.firestore();
  const today = toDateKey(dateKey);

  const snapshot = await db
    .collectionGroup("enrollments")
    .where("idTenant", "==", idTenant)
    .where("idBranch", "==", idBranch)
    .where("idClass", "==", idClass)
    .where("status", "==", "active")
    .get();

  let count = 0;
  snapshot.docs.forEach((d) => {
    const data = d.data() as EnrollmentDocData;
    const effectiveFrom = toDateKeyFromValue(
      data.effectiveFrom || data.startDate || data.createdAt
    );
    if (!isValidDateKey(effectiveFrom)) return;
    if (effectiveFrom > today) return;

    const effectiveTo = toDateKeyFromValue(data.effectiveTo);
    if (effectiveTo && isValidDateKey(effectiveTo) && effectiveTo < today) {
      return;
    }
    count += 1;
  });

  return count;
};

const setClassEnrolledCount = async (
  idTenant: string,
  idBranch: string,
  idClass: string,
  enrolledCount: number
): Promise<void> => {
  const db = admin.firestore();
  const ref = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("classes")
    .doc(idClass);

  await ref.set(
    {
      idTenant,
      idBranch,
      enrolledCount: Math.max(0, Number(enrolledCount || 0)),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

const handleEnrollmentWritten = async (event: EnrollmentWriteEvent) => {
  const idTenant = String(event.params.idTenant || "");
  const idBranch = String(event.params.idBranch || "");

  const before = event.data?.before.exists ? event.data.before.data() : undefined;
  const after = event.data?.after.exists ? event.data.after.data() : undefined;

  const idClass = String(after?.idClass || before?.idClass || "");
  if (!idTenant || !idBranch || !idClass) return;

  const beforeRange = normalizeRange(before);
  const afterRange = normalizeRange(after);

  const today = toDateKey(new Date().toISOString());
  const count = await countActiveEnrollmentsForClass(idTenant, idBranch, idClass, today);
  await setClassEnrolledCount(idTenant, idBranch, idClass, count);

  if (isSameRange(beforeRange, afterRange)) return;

  await updateSessionCountsForRange(admin.firestore(), idTenant, idBranch, beforeRange, -1);
  await updateSessionCountsForRange(admin.firestore(), idTenant, idBranch, afterRange, 1);
};

export const onEnrollmentWritten = onDocumentWritten(
  {
    document:
      "tenants/{idTenant}/branches/{idBranch}/clients/{clientId}/" + "enrollments/{enrollmentId}",
  },
  handleEnrollmentWritten
);

export const onMemberEnrollmentWritten = onDocumentWritten(
  {
    document:
      "tenants/{idTenant}/branches/{idBranch}/members/{memberId}/" + "enrollments/{enrollmentId}",
  },
  handleEnrollmentWritten
);

export const recomputeBranchSessionEnrollmentCounts = onCall(async (req) => {
  const idTenant = String(req.data?.idTenant || "");
  const idBranch = String(req.data?.idBranch || "");
  const idClass = String(req.data?.idClass || "");
  const startDate = toDateKey(String(req.data?.startDate || ""));
  const endDate = toDateKey(String(req.data?.endDate || ""));

  if (!idTenant || !idBranch) {
    throw new HttpsError("invalid-argument", "Tenant/unidade não identificados.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new HttpsError("invalid-argument", "Data inicial inválida.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new HttpsError("invalid-argument", "Data final inválida.");
  }
  if (endDate < startDate) {
    throw new HttpsError("invalid-argument", "Intervalo inválido.");
  }

  const db = admin.firestore();
  const sessionsRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("classSessions");

  let q = sessionsRef.where("sessionDate", ">=", startDate).where("sessionDate", "<=", endDate);

  if (idClass) {
    q = q.where("idClass", "==", idClass);
  }

  const snap = await q.get();
  if (snap.empty) return { updated: 0 };

  const writer = db.bulkWriter();
  writer.onWriteError((error: BulkWriterErrorLike) => shouldRetryBulkWriter(error));

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as SessionDocData;
    const classId = String(data?.idClass || "");
    const sessionDate = toDateKeyFromValue(data?.sessionDate);
    if (!classId || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      continue;
    }

    const count = await countActiveEnrollmentsForClass(idTenant, idBranch, classId, sessionDate);

    writer.set(
      doc.ref,
      {
        enrolledCount: Math.max(0, Number(count || 0)),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    updated += 1;
  }

  await writer.close();
  return { updated };
});

export const recomputeBranchEnrollmentCounts = onCall(async (req) => {
  const idTenant = String(req.data?.idTenant || "");
  const idBranch = String(req.data?.idBranch || "");
  const idClass = req.data?.idClass ? String(req.data.idClass) : "";

  if (!idTenant || !idBranch) {
    throw new HttpsError("invalid-argument", "Tenant/unidade não identificados.");
  }

  const db = admin.firestore();
  const classesRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("classes");

  const today = toDateKey(new Date().toISOString());

  const classIds: string[] = [];
  if (idClass) {
    classIds.push(idClass);
  } else {
    const snap = await classesRef.get();
    snap.docs.forEach((d) => classIds.push(d.id));
  }

  for (const cid of classIds) {
    const count = await countActiveEnrollmentsForClass(idTenant, idBranch, cid, today);
    await setClassEnrolledCount(idTenant, idBranch, cid, count);
  }

  return { updated: classIds.length };
});
