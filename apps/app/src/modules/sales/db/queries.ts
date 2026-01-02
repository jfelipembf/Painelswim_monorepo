import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

import { getFirebaseDb } from "../../../services/firebase";
import type { Sale } from "../sales.types";

type SaleDocData = Omit<Sale, "id"> & {
  idTenant?: string;
  createdAt?: unknown;
};

const mapSaleDoc = (idTenant: string, id: string, raw: SaleDocData): Sale => ({
  id,
  idTenant: raw.idTenant || idTenant,
  ...(raw as Omit<Sale, "id" | "idTenant">),
});

export const fetchSalesByClient = async (
  idTenant: string,
  idBranch: string,
  clientId: string
): Promise<Sale[]> => {
  if (!idTenant || !idBranch || !clientId) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "sales");

  // Keep query simple to reduce index requirements.
  const snap = await getDocs(query(ref, where("clientId", "==", clientId)));

  return snap.docs
    .map((docSnap) => mapSaleDoc(idTenant, docSnap.id, docSnap.data() as SaleDocData))
    .sort((a, b) => {
      const aSec = (a as { createdAt?: { seconds?: number } })?.createdAt?.seconds || 0;
      const bSec = (b as { createdAt?: { seconds?: number } })?.createdAt?.seconds || 0;
      return bSec - aSec;
    });
};

export const fetchSalesByBranchDateKey = async (
  idTenant: string,
  idBranch: string,
  branchDateKey: string
): Promise<Sale[]> => {
  if (!idTenant || !idBranch || !branchDateKey) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "sales");
  const snap = await getDocs(query(ref, where("branchDateKey", "==", branchDateKey)));

  return snap.docs
    .map((docSnap) => mapSaleDoc(idTenant, docSnap.id, docSnap.data() as SaleDocData))
    .sort((a, b) => {
      const aSec = (a as { createdAt?: { seconds?: number } })?.createdAt?.seconds || 0;
      const bSec = (b as { createdAt?: { seconds?: number } })?.createdAt?.seconds || 0;
      return bSec - aSec;
    });
};

export const fetchSalesRange = async (
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
  return snap.docs.map((docSnap) =>
    mapSaleDoc(idTenant, docSnap.id, docSnap.data() as SaleDocData)
  );
};
