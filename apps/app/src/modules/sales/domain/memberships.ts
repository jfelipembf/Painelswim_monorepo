import {
  collection,
  doc,
  serverTimestamp,
  type Firestore,
  type Transaction,
} from "firebase/firestore";

import type { CreateSalePayload, SaleItem } from "../sales.types";
import { addDaysIsoDateKey, addMonthsIsoDateKey, addYearsIsoDateKey, toIsoDateKey } from "./date";
import { removeUndefinedDeep } from "./sanitize";

const computeMembershipEndAtDateKey = (
  startAtIso: string,
  durationType: "day" | "week" | "month" | "year",
  duration: number
): string | undefined => {
  const startKey = toIsoDateKey(startAtIso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startKey)) return undefined;

  const n = Math.max(1, Number(duration || 1));
  const exclusiveEndKey =
    durationType === "day"
      ? addDaysIsoDateKey(startKey, n)
      : durationType === "week"
      ? addDaysIsoDateKey(startKey, n * 7)
      : durationType === "month"
      ? addMonthsIsoDateKey(startKey, n)
      : addYearsIsoDateKey(startKey, n);

  return addDaysIsoDateKey(exclusiveEndKey, -1);
};

const injectMembershipId = (
  items: SaleItem[],
  membershipId?: string,
  membershipIndex?: number
): SaleItem[] => {
  if (!membershipId || typeof membershipIndex !== "number" || membershipIndex < 0) {
    return items;
  }

  return items.map((item, idx) => (idx === membershipIndex ? { ...item, membershipId } : item));
};

const generateMembershipId = (
  db: Firestore,
  idTenant: string,
  idBranch: string,
  clientId: string
): string => {
  const membershipsCollection = collection(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "clients",
    clientId,
    "memberships"
  );
  return doc(membershipsCollection).id;
};

type MembershipRecordParams = {
  tx: Transaction;
  db: Firestore;
  idTenant: string;
  idBranch: string;
  clientId: string;
  membershipId: string;
  saleId: string;
  membership: NonNullable<CreateSalePayload["membership"]>;
  status: "active" | "pending";
  endAt?: string;
  previousMembershipId?: string;
  activateClient: boolean;
};

const createMembershipRecords = ({
  tx,
  db,
  idTenant,
  idBranch,
  clientId,
  membershipId,
  saleId,
  membership,
  status,
  endAt,
  previousMembershipId,
  activateClient,
}: MembershipRecordParams): void => {
  const membershipRef = doc(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "clients",
    clientId,
    "memberships",
    membershipId
  );

  if (previousMembershipId) {
    const previousRef = doc(
      db,
      "tenants",
      idTenant,
      "branches",
      idBranch,
      "clients",
      clientId,
      "memberships",
      previousMembershipId
    );
    tx.set(
      previousRef,
      {
        nextMembershipId: membershipId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const membershipDoc = removeUndefinedDeep({
    idTenant,
    idBranch,
    clientId,
    planId: membership.planId,
    planName: membership.planName,
    priceCents: membership.priceCents,
    startAt: membership.startAt,
    durationType: membership.durationType,
    duration: membership.duration,
    endAt,
    status,
    previousMembershipId,
    allowCrossBranchAccess: Boolean(membership.allowCrossBranchAccess),
    allowedBranchIds: membership.allowedBranchIds || [],
    saleId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }) as Record<string, unknown>;

  tx.set(membershipRef, membershipDoc);

  const clientRef = doc(db, "tenants", idTenant, "branches", idBranch, "clients", clientId);

  if (activateClient) {
    tx.set(
      clientRef,
      {
        status: "active",
        updatedAt: serverTimestamp(),
        activeMembershipId: membershipId,
        activeSaleId: saleId,
        access: {
          allowCrossBranchAccess: Boolean(membership.allowCrossBranchAccess),
          allowedBranchIds: membership.allowedBranchIds || [],
        },
      },
      { merge: true }
    );
  } else {
    tx.set(
      clientRef,
      {
        updatedAt: serverTimestamp(),
        scheduledMembershipId: membershipId,
      },
      { merge: true }
    );
  }
};

export {
  computeMembershipEndAtDateKey,
  injectMembershipId,
  generateMembershipId,
  createMembershipRecords,
};
