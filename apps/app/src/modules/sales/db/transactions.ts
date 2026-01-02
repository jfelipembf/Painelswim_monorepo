import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

import { getFirebaseDb } from "../../../services/firebase";
import type { CreateSalePayload } from "../sales.types";
import {
  addDaysIsoDateKey,
  buildBranchDateKey,
  buildSaleDocument,
  computeMembershipEndAtDateKey,
  computeSaleStatus,
  createCardReceivables,
  createManualReceivable,
  createMembershipRecords,
  generateMembershipId,
  getTodayDateKey,
  injectMembershipId,
  removeUndefinedDeep,
  resolveFinancials,
  sanitizePayments,
} from "../sales.domain";

export const createSale = async (
  idTenant: string,
  idBranch: string,
  payload: CreateSalePayload
): Promise<string> => {
  if (!idTenant || !idBranch) {
    throw new Error("ID do tenant/unidade é obrigatório.");
  }

  if (!payload?.clientId?.trim()) {
    throw new Error("ID do cliente é obrigatório.");
  }

  if (!payload?.consultantId?.trim()) {
    throw new Error("Consultor da venda é obrigatório.");
  }

  if (!Array.isArray(payload.items) || payload.items.length <= 0) {
    throw new Error("A venda precisa ter ao menos um item.");
  }

  if (payload.remainingCents > 0 && !payload.dueDate) {
    throw new Error("Informe a data prometida quando houver saldo em aberto.");
  }

  const db = getFirebaseDb();

  const salesRef = collection(db, "tenants", idTenant, "branches", idBranch, "sales");
  const saleRef = doc(salesRef);

  const clientRef = doc(db, "tenants", idTenant, "branches", idBranch, "clients", payload.clientId);
  const receivablesRef = collection(db, "tenants", idTenant, "branches", idBranch, "receivables");

  const dateKey = getTodayDateKey();
  const branchDateKey = buildBranchDateKey(dateKey, idBranch);
  const sanitizedPayloadBase = removeUndefinedDeep({ ...payload, idBranch }) as Record<string, any>;
  const payments = sanitizePayments(payload.payments);
  const { feesCents, netPaidTotalCents } = resolveFinancials(payload);
  const status = computeSaleStatus(payload.remainingCents);

  const membershipItemIndex = payload.items.findIndex((i) => i.type === "membership");
  const hasMembership = membershipItemIndex >= 0 && Boolean(payload.membership);
  const membershipId = hasMembership
    ? generateMembershipId(db as any, idTenant, idBranch, payload.clientId)
    : undefined;
  const items = injectMembershipId(payload.items, membershipId, membershipItemIndex);

  await runTransaction(db, async (tx) => {
    const clientSnap = await tx.get(clientRef);
    const clientData = clientSnap.exists()
      ? (clientSnap.data() as {
          activeMembershipId?: string;
          firstName?: string;
          lastName?: string;
          friendlyId?: string;
          photoUrl?: string;
        })
      : {};

    const activeMembershipId = String(clientData?.activeMembershipId || "");

    const clientSnapshot = removeUndefinedDeep({
      id: payload.clientId,
      name: `${String(clientData?.firstName || "").trim()} ${String(
        clientData?.lastName || ""
      ).trim()}`.trim(),
      friendlyId: clientData?.friendlyId ? String(clientData.friendlyId) : undefined,
      photoUrl: clientData?.photoUrl ? String(clientData.photoUrl) : undefined,
    }) as Record<string, unknown>;

    let previousMembershipId: string | undefined;
    let membershipStartAtIso = payload.membership?.startAt;
    let membershipStatus: "active" | "pending" = "active";
    let activateClient = true;

    if (payload.membership && activeMembershipId) {
      const activeMembershipRef = doc(
        db,
        "tenants",
        idTenant,
        "branches",
        idBranch,
        "clients",
        payload.clientId,
        "memberships",
        activeMembershipId
      );
      const activeMembershipSnap = await tx.get(activeMembershipRef);
      if (activeMembershipSnap.exists()) {
        const activeMembershipData = activeMembershipSnap.data() as {
          endAt?: string;
          status?: string;
        };
        const activeStatus = String(activeMembershipData.status || "");
        const activeEndKey = String(activeMembershipData.endAt || "").slice(0, 10);

        if (activeStatus === "active" || activeStatus === "paused") {
          if (/^\d{4}-\d{2}-\d{2}$/.test(activeEndKey)) {
            const nextStartKey = addDaysIsoDateKey(activeEndKey, 1);
            membershipStartAtIso = `${nextStartKey}T00:00:00.000Z`;
            membershipStatus = "pending";
            activateClient = false;
            previousMembershipId = activeMembershipId;
          }
        }
      }
    }

    const membershipEndAt = payload.membership
      ? computeMembershipEndAtDateKey(
          String(membershipStartAtIso || payload.membership.startAt),
          payload.membership.durationType,
          payload.membership.duration
        )
      : undefined;

    const normalizedMembership = payload.membership
      ? {
          ...payload.membership,
          startAt: String(membershipStartAtIso || payload.membership.startAt),
        }
      : undefined;

    if (payments.length > 0) {
      createCardReceivables({
        tx,
        receivablesRef: receivablesRef as any,
        payments,
        context: {
          idTenant,
          saleId: saleRef.id,
          clientId: payload.clientId,
          idBranch,
          consultantId: payload.consultantId,
          dateKey,
        },
      });
    }

    if (payload.remainingCents > 0 && payload.dueDate) {
      const remainingCents = Math.max(0, Number(payload.remainingCents || 0));
      createManualReceivable({
        tx,
        receivablesRef: receivablesRef as any,
        clientRef,
        context: {
          idTenant,
          saleId: saleRef.id,
          clientId: payload.clientId,
          idBranch,
          consultantId: payload.consultantId,
          dateKey,
        },
        amountCents: remainingCents,
        dueDate: payload.dueDate,
      });
    }

    if (membershipId && normalizedMembership) {
      createMembershipRecords({
        tx,
        db: db as any,
        idTenant,
        idBranch,
        clientId: payload.clientId,
        membershipId,
        saleId: saleRef.id,
        membership: normalizedMembership,
        status: membershipStatus,
        endAt: membershipEndAt,
        previousMembershipId,
        activateClient,
      });
    }

    tx.set(
      saleRef,
      buildSaleDocument({
        idTenant,
        sanitizedPayload: removeUndefinedDeep({
          ...sanitizedPayloadBase,
          idBranch,
          clientSnapshot,
          items,
        }) as Record<string, unknown>,
        dateKey,
        branchDateKey,
        items,
        status,
        feesCents,
        netPaidTotalCents,
      })
    );
  });

  return saleRef.id;
};
