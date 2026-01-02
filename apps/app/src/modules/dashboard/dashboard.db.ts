import {
  collection,
  collectionGroup,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";
import { fetchContracts } from "../contracts/contracts.db";
import type { Contract } from "../contracts/contracts.types";
import { fetchDailySummaries, fetchDailySummary } from "../dailySummaries/dailySummaries.db";
import type { DailySummary } from "../dailySummaries/dailySummaries.types";
import {
  fetchMonthlySummaries,
  fetchMonthlySummary,
} from "../monthlySummaries/monthlySummaries.db";
import type { MonthlySummary } from "../monthlySummaries/monthlySummaries.types";
import type { Sale } from "../sales/sales.types";

type MembershipRecord = {
  id: string;
  clientId?: string;
  planId?: string;
  planName?: string;
  status?: string;
  statusDateKey?: string;
  startAt?: string;
  endAt?: string;
  previousMembershipId?: string;
};

const membershipsGroup = () => collectionGroup(getFirebaseDb(), "memberships");

const normalizeDateKey = (value: string): string => String(value || "").slice(0, 10);

const normalizeIsoRange = (startDateKey: string, endDateKey: string) => {
  const start = normalizeDateKey(startDateKey);
  const end = normalizeDateKey(endDateKey);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return null;
  }
  return {
    start,
    end,
    startIso: `${start}T00:00:00.000Z`,
    endIso: `${end}T23:59:59.999Z`,
  };
};

export const getActiveStudentsCount = async (
  idTenant: string,
  idBranch: string
): Promise<number> => {
  if (!idTenant || !idBranch) return 0;

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "clients");
  const q = query(ref, where("status", "==", "active"));
  const snap = await getCountFromServer(q);
  return snap.data().count;
};

export const getSalesRange = async (
  idTenant: string,
  idBranch: string,
  startDateKey: string,
  endDateKey: string
): Promise<Sale[]> => {
  if (!idTenant || !idBranch || !startDateKey || !endDateKey) return [];

  const start = String(startDateKey).slice(0, 10);
  const end = String(endDateKey).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "sales");
  const q = query(
    ref,
    where("dateKey", ">=", start),
    where("dateKey", "<=", end),
    orderBy("dateKey", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    idTenant,
    ...(d.data() as Omit<Sale, "id" | "idTenant">),
  }));
};

export const getMonthlySummary = async (
  idTenant: string,
  idBranch: string,
  monthKey: string
): Promise<MonthlySummary | null> => fetchMonthlySummary(idTenant, idBranch, monthKey);

export const getMonthlySummaries = async (
  idTenant: string,
  idBranch: string
): Promise<MonthlySummary[]> => fetchMonthlySummaries(idTenant, idBranch);

export const getDailySummary = async (
  idTenant: string,
  idBranch: string,
  dateKey: string
): Promise<DailySummary | null> => fetchDailySummary(idTenant, idBranch, dateKey);

export const getDailySummaries = async (
  idTenant: string,
  idBranch: string
): Promise<DailySummary[]> => fetchDailySummaries(idTenant, idBranch);

export const getAvailableContracts = async (
  idTenant: string,
  idBranch: string
): Promise<Contract[]> => fetchContracts(idTenant, idBranch, { activeOnly: true });

export const countMembershipsByStatus = async (
  idTenant: string,
  idBranch: string,
  status: string
): Promise<number> => {
  if (!idTenant || !idBranch || !status) return 0;

  const q = query(
    membershipsGroup(),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("status", "==", status)
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
};

export const fetchMembershipsByStatus = async (
  idTenant: string,
  idBranch: string,
  status: string
): Promise<MembershipRecord[]> => {
  if (!idTenant || !idBranch || !status) return [];

  const q = query(
    membershipsGroup(),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("status", "==", status)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MembershipRecord) }));
};

export const fetchMembershipsByStatusDateRange = async (
  idTenant: string,
  idBranch: string,
  status: string,
  startDateKey: string,
  endDateKey: string
): Promise<MembershipRecord[]> => {
  if (!idTenant || !idBranch || !status) return [];
  const range = normalizeIsoRange(startDateKey, endDateKey);
  if (!range) return [];

  const q = query(
    membershipsGroup(),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("status", "==", status),
    where("statusDateKey", ">=", range.start),
    where("statusDateKey", "<=", range.end),
    orderBy("statusDateKey", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MembershipRecord) }));
};

export const fetchMembershipsByStartRange = async (
  idTenant: string,
  idBranch: string,
  startDateKey: string,
  endDateKey: string
): Promise<MembershipRecord[]> => {
  if (!idTenant || !idBranch) return [];
  const range = normalizeIsoRange(startDateKey, endDateKey);
  if (!range) return [];

  const q = query(
    membershipsGroup(),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("startAt", ">=", range.start),
    where("startAt", "<=", range.endIso),
    orderBy("startAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MembershipRecord) }));
};

export const fetchMembershipsStartedBefore = async (
  idTenant: string,
  idBranch: string,
  endDateKey: string
): Promise<MembershipRecord[]> => {
  if (!idTenant || !idBranch || !endDateKey) return [];

  const end = normalizeDateKey(endDateKey);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) return [];

  const endIso = `${end}T23:59:59.999Z`;

  const q = query(
    membershipsGroup(),
    where("idTenant", "==", idTenant),
    where("idBranch", "==", idBranch),
    where("startAt", "<=", endIso),
    orderBy("startAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MembershipRecord) }));
};
