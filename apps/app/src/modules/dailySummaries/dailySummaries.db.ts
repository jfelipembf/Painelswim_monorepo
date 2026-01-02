import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import { mapDailySummaryDoc } from "./dailySummaries.domain";

import type { DailySummary } from "./dailySummaries.types";

type DailySummaryDocData = Omit<DailySummary, "id"> & {
  idTenant?: string;
  idBranch?: string;
  dateKey?: string;
};

const dailySummariesCollection = (idTenant: string, idBranch: string) => {
  const db = getFirebaseDb();
  return collection(db, "tenants", idTenant, "branches", idBranch, "dailySummaries");
};

export const fetchDailySummary = async (
  idTenant: string,
  idBranch: string,
  dateKey: string
): Promise<DailySummary | null> => {
  if (!idTenant || !idBranch || !dateKey) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "dailySummaries", dateKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapDailySummaryDoc(idTenant, idBranch, snap.id, snap.data() as DailySummaryDocData);
};

export const fetchDailySummaries = async (
  idTenant: string,
  idBranch: string
): Promise<DailySummary[]> => {
  if (!idTenant || !idBranch) return [];

  const ref = dailySummariesCollection(idTenant, idBranch);
  const snap = await getDocs(query(ref, orderBy("dateKey", "desc")));

  return snap.docs.map((d) =>
    mapDailySummaryDoc(idTenant, idBranch, d.id, d.data() as DailySummaryDocData)
  );
};

export const fetchDailySummariesRange = async (
  idTenant: string,
  idBranch: string,
  startDateKey: string,
  endDateKey: string
): Promise<DailySummary[]> => {
  if (!idTenant || !idBranch || !startDateKey || !endDateKey) return [];

  const start = String(startDateKey).slice(0, 10);
  const end = String(endDateKey).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return [];
  }

  const ref = dailySummariesCollection(idTenant, idBranch);
  const snap = await getDocs(
    query(ref, where("dateKey", ">=", start), where("dateKey", "<=", end), orderBy("dateKey"))
  );

  return snap.docs.map((d) =>
    mapDailySummaryDoc(idTenant, idBranch, d.id, d.data() as DailySummaryDocData)
  );
};
