import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import { mapMonthlySummaryDoc } from "./monthlySummaries.domain";

import type { MonthlySummary } from "./monthlySummaries.types";

type MonthlySummaryDocData = Omit<MonthlySummary, "id"> & {
  idTenant?: string;
  idBranch?: string;
  monthKey?: string;
};

const monthlySummariesCollection = (idTenant: string, idBranch: string) => {
  const db = getFirebaseDb();
  return collection(db, "tenants", idTenant, "branches", idBranch, "monthlySummaries");
};

export const fetchMonthlySummary = async (
  idTenant: string,
  idBranch: string,
  monthKey: string
): Promise<MonthlySummary | null> => {
  if (!idTenant || !idBranch || !monthKey) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "monthlySummaries", monthKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapMonthlySummaryDoc(idTenant, idBranch, snap.id, snap.data() as MonthlySummaryDocData);
};

export const fetchMonthlySummaries = async (
  idTenant: string,
  idBranch: string
): Promise<MonthlySummary[]> => {
  if (!idTenant || !idBranch) return [];

  const ref = monthlySummariesCollection(idTenant, idBranch);
  const snap = await getDocs(query(ref, orderBy("monthKey", "desc")));

  return snap.docs.map((d) =>
    mapMonthlySummaryDoc(idTenant, idBranch, d.id, d.data() as MonthlySummaryDocData)
  );
};
