import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onCall, HttpsError } from "firebase-functions/v2/https";

type CancelMembershipRequest = {
  idTenant: string;
  idBranch: string;
  clientId: string;
  membershipId: string;
  reason?: string;
};

const toDateKey = (value: string): string => String(value || "").slice(0, 10);

const buildBranchDateKey = (dateKey: string, idBranch: string): string =>
  `${String(dateKey || "").slice(0, 10)}_${String(idBranch || "")}`;

const chunk = <T>(arr: T[], size: number): T[][] => {
  const n = Math.max(1, Number(size || 1));
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += n) res.push(arr.slice(i, i + n));
  return res;
};

export const cancelMembership = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado.");
  }

  const data = (req.data || {}) as CancelMembershipRequest;
  const idTenant = String(data.idTenant || "").trim();
  const idBranch = String(data.idBranch || "").trim();
  const clientId = String(data.clientId || "").trim();
  const membershipId = String(data.membershipId || "").trim();
  const reason = String(data.reason || "").trim();

  if (!idTenant || !idBranch || !clientId || !membershipId) {
    throw new HttpsError(
      "invalid-argument",
      "idTenant, idBranch, clientId e membershipId são obrigatórios."
    );
  }

  const todayKey = toDateKey(new Date().toISOString());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(todayKey)) {
    throw new HttpsError("invalid-argument", "Data inválida.");
  }

  const db = admin.firestore();
  const membershipRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("clients")
    .doc(clientId)
    .collection("memberships")
    .doc(membershipId);

  const membershipSnap = await membershipRef.get();
  if (!membershipSnap.exists) {
    throw new HttpsError("not-found", "Matrícula não encontrada.");
  }

  const membership = membershipSnap.data() as admin.firestore.DocumentData;
  const saleId = String(membership?.saleId || "");

  const receivablesRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("receivables");

  let receivablesDocs: admin.firestore.QueryDocumentSnapshot[] = [];
  if (saleId) {
    const receivablesSnap = await receivablesRef.where("saleId", "==", saleId).get();
    receivablesDocs = receivablesSnap.docs;
  }

  let cancelDebtCents = 0;
  let anticipatedExpenseCents = 0;
  const receivableUpdates: admin.firestore.DocumentReference[] = [];

  receivablesDocs.forEach((doc) => {
    const data = doc.data() as admin.firestore.DocumentData;
    const status = String(data?.status || "");
    const kind = String(data?.kind || "");
    const anticipated = Boolean(data?.anticipated);
    const amountCents = Math.max(0, Number(data?.amountCents || 0));
    const amountPaidCents = Math.max(0, Number(data?.amountPaidCents || 0));
    const isCanceled = status === "canceled";
    const isPaid = status === "paid";
    const isManual = kind === "manual";

    if (!isCanceled && anticipated) {
      anticipatedExpenseCents += amountCents;
    }

    if (isManual && !isCanceled && !isPaid) {
      cancelDebtCents += Math.max(0, amountCents - amountPaidCents);
    }

    if (!isCanceled && !isPaid) {
      receivableUpdates.push(doc.ref);
    }
  });

  for (const group of chunk(receivableUpdates, 400)) {
    const batch = db.batch();
    group.forEach((ref) => {
      batch.update(ref, {
        status: "canceled",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  const clientRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("clients")
    .doc(clientId);

  const clientSnap = await clientRef.get();
  const currentDebt = Number(clientSnap.data()?.debtCents || 0);
  const nextDebt = Math.max(0, currentDebt - cancelDebtCents);
  const activeMembershipId = String(clientSnap.data()?.activeMembershipId || "");

  const updates: Record<string, unknown> = {
    debtCents: nextDebt,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (activeMembershipId && activeMembershipId === membershipId) {
    updates.activeMembershipId = FieldValue.delete();
    updates.activeSaleId = FieldValue.delete();
    updates.status = "inactive";
  }

  await clientRef.set(updates, { merge: true });

  const membershipUpdates: Record<string, unknown> = {
    status: "canceled",
    statusDateKey: todayKey,
    endAt: todayKey,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (reason) {
    membershipUpdates.cancellationReason = reason;
  }

  await membershipRef.set(membershipUpdates, { merge: true });

  const enrollmentsRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("clients")
    .doc(clientId)
    .collection("enrollments");

  const enrollmentsQuery = enrollmentsRef.where("status", "==", "active");
  const enrollmentsSnap = await enrollmentsQuery.get();
  const enrollmentUpdates = enrollmentsSnap.docs.map((doc) => doc.ref);

  for (const group of chunk(enrollmentUpdates, 400)) {
    const batch = db.batch();
    group.forEach((ref) => {
      batch.update(ref, {
        status: "inactive",
        effectiveTo: todayKey,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  const classUpdates = enrollmentsSnap.docs
    .map((doc) => String(doc.data()?.idClass || ""))
    .filter(Boolean);

  for (const group of chunk(classUpdates, 400)) {
    const batch = db.batch();
    group.forEach((classId) => {
      const classRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("classes")
        .doc(classId);
      batch.update(classRef, {
        enrolledCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  if (anticipatedExpenseCents > 0) {
    const movementRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("cashMovements")
      .doc();

    const description = `Estorno de cancelamento de contrato (${String(
      membership?.planName || "Contrato"
    )})`;

    await movementRef.set({
      idTenant,
      idBranch,
      type: "expense",
      amountCents: anticipatedExpenseCents,
      category: "estorno",
      description,
      dateKey: todayKey,
      branchDateKey: buildBranchDateKey(todayKey, idBranch),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { ok: true };
});
