import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { getFirebaseServices } from "../../helpers/firebase_helper";
import { BRANCHES_COLLECTION } from "./branches.types";

const guardDb = () => {
  const services = getFirebaseServices();
  if (!services?.db) {
    throw new Error("Firebase não inicializado. Verifique REACT_APP_DEFAULTAUTH.");
  }
  return services.db;
};

export const listBranches = async ({ tenantId } = {}) => {
  const db = guardDb();

  const base = collection(db, BRANCHES_COLLECTION);
  const q = tenantId
    ? query(base, where("tenantId", "==", tenantId), orderBy("createdAt", "desc"))
    : query(base, orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBranchById = async (branchId) => {
  const db = guardDb();
  const ref = doc(db, BRANCHES_COLLECTION, branchId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const createBranch = async (payload) => {
  const db = guardDb();
  const data = {
    tenantId: payload.tenantId,
    name: payload.name,
    status: payload.status || "active",
    timezone: payload.timezone || "America/Sao_Paulo",
    address: payload.address || {},
    stripeCustomerId: payload.stripeCustomerId || "",
    stripeSubscriptionId: payload.stripeSubscriptionId || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, BRANCHES_COLLECTION), data);
  return { id: ref.id, ...data };
};

export const updateBranch = async (branchId, updates) => {
  const db = guardDb();
  const ref = doc(db, BRANCHES_COLLECTION, branchId);
  await setDoc(
    ref,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return true;
};
