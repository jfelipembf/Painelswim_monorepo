import { doc, getDoc } from "firebase/firestore";
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
      const data = snap.data() as { name?: string; billingStatus?: BillingStatus };
      return {
        idBranch: snap.id,
        name: data.name || snap.id,
        billingStatus: data.billingStatus ?? "unknown",
      };
    });
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
