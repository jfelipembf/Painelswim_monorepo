import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onCall, HttpsError } from "firebase-functions/v2/https";

type SuspendMembershipRequest = {
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

export const suspendMembership = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado.");
  }

  const data = (req.data || {}) as SuspendMembershipRequest;

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

  if (!Number.isFinite(days) || days <= 0) {
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
    if (status !== "active") {
      throw new HttpsError("failed-precondition", "A matrícula precisa estar ativa.");
    }

    const planId = String(membership?.planId || "");
    if (!planId) {
      throw new HttpsError("failed-precondition", "Plano não encontrado na matrícula.");
    }

    const contractRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("contracts")
      .doc(planId);
    const contractSnap = await tx.get(contractRef);
    if (!contractSnap.exists) {
      throw new HttpsError("not-found", "Contrato não encontrado.");
    }

    const contract = contractSnap.data() as admin.firestore.DocumentData;
    const allowFreeze = Boolean(contract?.allowFreeze);
    if (!allowFreeze) {
      throw new HttpsError("failed-precondition", "Este contrato não permite suspensão.");
    }

    const maxTimes = Number(contract?.maxSuspensionTimes || 0);
    const maxDays = Number(contract?.maxSuspensionDays || 0);
    const minDays = Number(contract?.minimumSuspensionDays || 0);
    const currentCount = Number(membership?.suspensionCount || 0);
    const usedDays = Number(membership?.suspensionDaysUsed || 0);

    if (maxTimes > 0 && currentCount >= maxTimes) {
      throw new HttpsError("failed-precondition", "Limite de suspensões atingido.");
    }
    if (minDays > 0 && days < minDays) {
      throw new HttpsError("failed-precondition", `Suspensão mínima de ${minDays} dias.`);
    }
    if (maxDays > 0 && days > maxDays) {
      throw new HttpsError("failed-precondition", `Suspensão máxima de ${maxDays} dias.`);
    }

    const endAtKey = toDateKey(String(membership?.endAt || ""));
    if (!endAtKey) {
      throw new HttpsError("failed-precondition", "Matrícula sem data final para prorrogação.");
    }

    const pauseUntil = addDaysDateKey(todayKey, days - 1);
    const nextEndAt = addDaysDateKey(endAtKey, days);
    if (!pauseUntil || !nextEndAt) {
      throw new HttpsError("failed-precondition", "Não foi possível calcular a suspensão.");
    }

    const suspensionRef = membershipRef.collection("suspensions").doc();

    tx.set(suspensionRef, {
      idTenant,
      idBranch,
      clientId,
      membershipId,
      startAt: todayKey,
      endAt: pauseUntil,
      days,
      reason: reason || null,
      createdBy: req.auth?.uid || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(membershipRef, {
      status: "paused",
      statusDateKey: todayKey,
      pauseStartAt: todayKey,
      pauseUntil,
      endAt: nextEndAt,
      suspensionCount: currentCount + 1,
      suspensionDaysUsed: usedDays + days,
      suspensionDaysCurrent: days,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});
