import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onCall, HttpsError } from "firebase-functions/v2/https";

type AdjustMembershipDaysRequest = {
  idTenant: string;
  idBranch: string;
  clientId: string;
  membershipId: string;
  days: number;
  reason?: string;
};

const toDateKey = (value: string): string => String(value || "").slice(0, 10);

const addDaysDateKey = (dateKey: string, days: number): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "";
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + Number(days || 0));
  return String(base.toISOString()).slice(0, 10);
};

export const adjustMembershipDays = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado.");
  }

  const data = (req.data || {}) as AdjustMembershipDaysRequest;
  const idTenant = String(data.idTenant || "").trim();
  const idBranch = String(data.idBranch || "").trim();
  const clientId = String(data.clientId || "").trim();
  const membershipId = String(data.membershipId || "").trim();
  const days = Math.floor(Number(data.days || 0));
  const reason = String(data.reason || "").trim();

  if (!idTenant || !idBranch || !clientId || !membershipId) {
    throw new HttpsError(
      "invalid-argument",
      "idTenant, idBranch, clientId e membershipId são obrigatórios."
    );
  }

  if (!Number.isFinite(days) || days === 0) {
    throw new HttpsError("invalid-argument", "Informe a quantidade de dias.");
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

  await db.runTransaction(async (tx) => {
    const membershipSnap = await tx.get(membershipRef);
    if (!membershipSnap.exists) {
      throw new HttpsError("not-found", "Matrícula não encontrada.");
    }

    const membership = membershipSnap.data() as admin.firestore.DocumentData;
    const status = String(membership?.status || "");
    if (status === "canceled" || status === "expired") {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível ajustar uma matrícula cancelada ou expirada."
      );
    }

    const endAtKey = toDateKey(String(membership?.endAt || ""));
    if (!endAtKey) {
      throw new HttpsError("failed-precondition", "Matrícula sem data final para ajuste.");
    }

    const nextEndAt = addDaysDateKey(endAtKey, days);
    if (!nextEndAt) {
      throw new HttpsError("failed-precondition", "Não foi possível calcular a nova data.");
    }

    const startKey = toDateKey(String(membership?.startAt || ""));
    if (startKey && nextEndAt < startKey) {
      throw new HttpsError("failed-precondition", "A data final não pode ser anterior ao início.");
    }

    if (nextEndAt < todayKey) {
      throw new HttpsError("failed-precondition", "A data final não pode ser anterior a hoje.");
    }

    const adjustmentRef = membershipRef.collection("adjustments").doc();

    tx.set(adjustmentRef, {
      idTenant,
      idBranch,
      clientId,
      membershipId,
      days,
      reason: reason || null,
      previousEndAt: endAtKey,
      nextEndAt,
      createdBy: req.auth?.uid || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(membershipRef, {
      endAt: nextEndAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});
