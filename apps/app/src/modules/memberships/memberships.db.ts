import {
  collection,
  collectionGroup,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import { deactivateClientEnrollmentsFromDate } from "../enrollments/enrollments.db";

import { normalizeMembershipPayload } from "./memberships.domain";

import type {
  CreateMembershipPayload,
  Membership,
  MembershipAdjustment,
  MembershipStatus,
  MembershipSuspension,
} from "./memberships.types";

type MembershipDocData = Omit<Membership, "id"> & {
  idTenant?: string;
  clientId?: string;
  idBranch?: string;
};

type MembershipSnapshot =
  | QueryDocumentSnapshot<DocumentData, DocumentData>
  | DocumentSnapshot<DocumentData, DocumentData>;

const mapMembershipDoc = (
  idTenant: string,
  idBranch: string,
  clientId: string,
  id: string,
  data: MembershipDocData
): Membership => ({
  id,
  idTenant: data.idTenant || idTenant,
  idBranch: String(data.idBranch || idBranch),
  clientId: data.clientId || clientId,
  ...data,
  priceCents: Number(data.priceCents || 0),
  allowedBranchIds: Array.isArray(data.allowedBranchIds) ? data.allowedBranchIds : [],
  allowCrossBranchAccess: Boolean(data.allowCrossBranchAccess),
});

const membershipsCollection = (idTenant: string, idBranch: string, clientId: string) => {
  const db = getFirebaseDb();
  return collection(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "clients",
    clientId,
    "memberships"
  );
};

const membershipsGroup = () => collectionGroup(getFirebaseDb(), "memberships");

const membershipDocRef = (
  idTenant: string,
  idBranch: string,
  clientId: string,
  membershipId: string
) => {
  const db = getFirebaseDb();
  return doc(
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
};

const normalizeDateKey = (value: string): string => String(value || "").slice(0, 10);

const normalizeDateRange = (startDateKey: string, endDateKey: string) => {
  const start = normalizeDateKey(startDateKey);
  const end = normalizeDateKey(endDateKey);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return null;
  }
  return { start, end };
};

export const createMembership = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  payload: CreateMembershipPayload
): Promise<string> => {
  if (!idTenant || !idBranch || !clientId) {
    throw new Error("Dados inválidos para matrícula.");
  }

  const normalized = normalizeMembershipPayload(payload);
  if (!normalized.planId || !normalized.planName) {
    throw new Error("Plano é obrigatório.");
  }
  if (!normalized.startAt) {
    throw new Error("Data de início é obrigatória.");
  }

  const db = getFirebaseDb();
  const ref = doc(membershipsCollection(idTenant, idBranch, clientId));

  await setDoc(ref, {
    idTenant,
    idBranch,
    clientId,
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
};

export const fetchClientMemberships = async (
  idTenant: string,
  idBranch: string,
  clientId: string
): Promise<Membership[]> => {
  if (!idTenant || !idBranch || !clientId) return [];
  const ref = membershipsCollection(idTenant, idBranch, clientId);
  const snapshot = await getDocs(query(ref, orderBy("createdAt", "desc")));

  return snapshot.docs.map((d) =>
    mapMembershipDoc(idTenant, idBranch, clientId, d.id, d.data() as MembershipDocData)
  );
};

export const fetchMembershipsByEndRange = async (
  idTenant: string,
  idBranch: string,
  startDateKey: string,
  endDateKey: string
): Promise<Membership[]> => {
  if (!idTenant || !idBranch) return [];
  const range = normalizeDateRange(startDateKey, endDateKey);
  if (!range) return [];

  const q = query(
    membershipsGroup(),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("endAt", ">=", range.start),
    where("endAt", "<=", range.end),
    orderBy("endAt", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as MembershipDocData;
    const tenantId = data.idTenant || idTenant;
    const branchId = String(data.idBranch || idBranch);
    const clientId = String(data.clientId || "");
    return mapMembershipDoc(tenantId, branchId, clientId, docSnap.id, data);
  });
};

export const fetchMembershipById = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  membershipId: string
): Promise<Membership | null> => {
  if (!idTenant || !idBranch || !clientId || !membershipId) return null;
  const ref = membershipDocRef(idTenant, idBranch, clientId, membershipId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapMembershipDoc(idTenant, idBranch, clientId, snap.id, snap.data() as MembershipDocData);
};

export const updateMembershipStatus = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  membershipId: string,
  status: MembershipStatus
): Promise<void> => {
  if (!idTenant || !idBranch || !clientId || !membershipId) {
    throw new Error("Matrícula não identificada.");
  }

  const db = getFirebaseDb();
  const ref = doc(
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

  const nowDateKey = String(new Date().toISOString()).slice(0, 10);

  await updateDoc(ref, {
    status,
    statusDateKey: nowDateKey,
    endAt: status === "canceled" || status === "expired" ? nowDateKey : deleteField(),
    updatedAt: serverTimestamp(),
  });

  if (status === "canceled" || status === "expired") {
    await deactivateClientEnrollmentsFromDate(idTenant, idBranch, clientId, nowDateKey);
  }
};

export const fetchMembershipSuspensions = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  membershipId: string
): Promise<MembershipSuspension[]> => {
  if (!idTenant || !idBranch || !clientId || !membershipId) return [];
  const db = getFirebaseDb();
  const ref = collection(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "clients",
    clientId,
    "memberships",
    membershipId,
    "suspensions"
  );
  const snapshot = await getDocs(query(ref, orderBy("createdAt", "desc")));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, any>;
    return {
      id: docSnap.id,
      idTenant: data.idTenant,
      idBranch: data.idBranch,
      clientId: data.clientId,
      membershipId: data.membershipId,
      startAt: String(data.startAt || ""),
      endAt: String(data.endAt || ""),
      days: Number(data.days || 0),
      reason: data.reason ? String(data.reason) : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
};

export const fetchMembershipAdjustments = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  membershipId: string
): Promise<MembershipAdjustment[]> => {
  if (!idTenant || !idBranch || !clientId || !membershipId) return [];
  const db = getFirebaseDb();
  const ref = collection(
    db,
    "tenants",
    idTenant,
    "branches",
    idBranch,
    "clients",
    clientId,
    "memberships",
    membershipId,
    "adjustments"
  );
  const snapshot = await getDocs(query(ref, orderBy("createdAt", "desc")));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, any>;
    return {
      id: docSnap.id,
      idTenant: data.idTenant,
      idBranch: data.idBranch,
      clientId: data.clientId,
      membershipId: data.membershipId,
      days: Number(data.days || 0),
      previousEndAt: data.previousEndAt ? String(data.previousEndAt) : undefined,
      nextEndAt: data.nextEndAt ? String(data.nextEndAt) : undefined,
      reason: data.reason ? String(data.reason) : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
};
