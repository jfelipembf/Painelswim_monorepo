import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { BillingStatus, Branch } from "../redux/slices/branchSlice";
import { getFirebaseDb } from "./firebase";

export const fetchBranchesForUser = async (idTenant: string, uid: string): Promise<Branch[]> => {
  if (!idTenant || !uid) {
    return [];
  }

  const db = getFirebaseDb();
  const memberRef = doc(db, "tenants", idTenant, "members", uid);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    return [];
  }

  const memberData = memberSnap.data() as { branchIds?: string[] };
  const branchIds = Array.isArray(memberData.branchIds) ? memberData.branchIds : [];

  if (branchIds.length === 0) {
    return [];
  }

  const branchSnaps = await Promise.all(
    branchIds.map((idBranch) => getDoc(doc(db, "tenants", idTenant, "branches", idBranch)))
  );

  return branchSnaps
    .filter((snap) => snap.exists())
    .map((snap) => {
      const data = snap.data() as { name?: string; slug?: string; billingStatus?: BillingStatus };
      return {
        idBranch: snap.id,
        name: data.name || snap.id,
        slug: data.slug,
        billingStatus: data.billingStatus ?? "unknown",
      };
    });
};

export const findBranchBySlug = async (idTenant: string, branchSlug: string): Promise<Branch | null> => {
  if (!idTenant || !branchSlug) {
    return null;
  }

  const db = getFirebaseDb();
  const branchesRef = collection(db, "tenants", idTenant, "branches");
  const q = query(branchesRef, where("slug", "==", branchSlug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as { name?: string; slug?: string; billingStatus?: BillingStatus };
  
  return {
    idBranch: doc.id,
    name: data.name || doc.id,
    slug: data.slug,
    billingStatus: data.billingStatus ?? "unknown",
  };
};

export const fetchBranchBillingStatus = async (
  idTenant: string,
  idBranch: string
): Promise<BillingStatus> => {
  if (!idTenant || !idBranch) {
    return "unknown";
  }

  const db = getFirebaseDb();
  const branchRef = doc(db, "tenants", idTenant, "branches", idBranch);
  const branchSnap = await getDoc(branchRef);

  if (!branchSnap.exists()) {
    return "unknown";
  }

  const data = branchSnap.data() as { billingStatus?: BillingStatus };
  return data.billingStatus ?? "unknown";
};
