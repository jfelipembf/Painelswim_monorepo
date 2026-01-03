import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { getFirebaseServices } from "../../helpers/firebase_helper";
import { TENANTS_COLLECTION } from "./tenants.types";

const guardDb = () => {
  const services = getFirebaseServices();
  if (!services?.db) {
    throw new Error("Firebase não inicializado. Verifique REACT_APP_DEFAULTAUTH.");
  }
  return services.db;
};

export const listTenants = async () => {
  const db = guardDb();
  const q = query(collection(db, TENANTS_COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTenant = async (tenantId) => {
  const db = guardDb();
  const ref = doc(db, TENANTS_COLLECTION, tenantId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Tenant não encontrado");
  }
  return { id: snap.id, ...snap.data() };
};

export const getTenantById = async (tenantId) => {
  const db = guardDb();
  const ref = doc(db, TENANTS_COLLECTION, tenantId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

const generateBranchSlug = async (db, tenantId) => {
  const branchesRef = collection(db, TENANTS_COLLECTION, tenantId, "branches");
  const snapshot = await getDocs(branchesRef);
  const count = snapshot.size + 1;
  return `unidade-${count}`;
};

export const createTenant = async (tenantData, ownerData) => {
  const db = guardDb();
  const { getFirebaseServices } = require("../../helpers/firebase_helper");
  const services = getFirebaseServices();
  const auth = services?.auth;

  if (!auth) {
    throw new Error("Firebase Auth não inicializado");
  }

  const { name, slug, cnpj, logoUrl, address, status } = tenantData;
  const { email, password, firstName, lastName } = ownerData;

  if (!email || !password) {
    throw new Error("Email e senha do owner são obrigatórios");
  }

  const slugDocRef = doc(db, "tenantsBySlug", slug);
  const slugDoc = await getDoc(slugDocRef);
  if (slugDoc.exists()) {
    throw new Error("Slug já está em uso");
  }

  // Criar usuário no Firebase Authentication
  const { createUserWithEmailAndPassword } = require("firebase/auth");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const ownerUid = userCredential.user.uid;

  // Criar documento do usuário em users/{uid}
  const userRef = doc(db, "users", ownerUid);
  await setDoc(userRef, {
    uid: ownerUid,
    email,
    firstName: firstName || "",
    lastName: lastName || "",
    role: "owner",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const tenantRef = doc(collection(db, TENANTS_COLLECTION));
  const tenantId = tenantRef.id;

  await setDoc(tenantRef, {
    name,
    slug,
    cnpj: cnpj || "",
    logoUrl: logoUrl || "",
    status: status || "active",
    address: address || {},
    branding: tenantData.branding || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(slugDocRef, { idTenant: tenantId });

  const memberRef = doc(db, TENANTS_COLLECTION, tenantId, "members", ownerUid);
  await setDoc(memberRef, {
    role: "owner",
    roleId: "owner",
    roleByBranch: {},
    branchIds: [],
    status: "active",
    createdAt: serverTimestamp(),
  });

  const branchSlug = await generateBranchSlug(db, tenantId);
  const branchRef = doc(collection(db, TENANTS_COLLECTION, tenantId, "branches"));
  const branchId = branchRef.id;

  await setDoc(branchRef, {
    tenantId,
    branchId,
    name: `${name} - Unidade 1`,
    slug: branchSlug,
    status: "active",
    billingStatus: "active",
    timezone: "America/Sao_Paulo",
    address: address || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Adicionar owner como member da primeira branch
  const branchMemberRef = doc(db, TENANTS_COLLECTION, tenantId, "branches", branchId, "members", ownerUid);
  await setDoc(branchMemberRef, {
    idUser: ownerUid,
    email,
    role: "admin",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(memberRef, {
    branchIds: [branchId],
    roleByBranch: { [branchId]: "admin" },
  });

  return { tenantId, branchId, ownerUid };
};

export const getTenantBranches = async (tenantId) => {
  const db = guardDb();
  const branchesRef = collection(db, TENANTS_COLLECTION, tenantId, "branches");
  const snapshot = await getDocs(branchesRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBranchById = async ({ branchId, tenantId } = {}) => {
  const db = guardDb();

  if (tenantId) {
    const directRef = doc(db, TENANTS_COLLECTION, tenantId, "branches", branchId);
    const directSnap = await getDoc(directRef);
    if (!directSnap.exists()) return null;
    return { id: directSnap.id, tenantId, ...directSnap.data() };
  }

  const q = query(
    collectionGroup(db, "branches"),
    where("branchId", "==", branchId),
    limit(1)
  );
  const snap = await getDocs(q);
  const docSnap = snap.docs?.[0];
  if (!docSnap) return null;

  const parts = docSnap.ref.path.split("/");
  const derivedTenantId = parts?.[1] || "";
  return { id: docSnap.id, tenantId: derivedTenantId, ...docSnap.data() };
};

export const updateBranch = async (tenantId, branchId, updates) => {
  const db = guardDb();
  const ref = doc(db, TENANTS_COLLECTION, tenantId, "branches", branchId);
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

export const createBranch = async (tenantId, branchData) => {
  const db = guardDb();
  const branchSlug = await generateBranchSlug(db, tenantId);
  const branchRef = doc(collection(db, TENANTS_COLLECTION, tenantId, "branches"));
  const branchId = branchRef.id;

  await setDoc(branchRef, {
    tenantId,
    branchId,
    name: branchData.name,
    slug: branchSlug,
    cnpj: branchData.cnpj || "",
    logoUrl: branchData.logoUrl || "",
    status: "active",
    billingStatus: "active",
    timezone: branchData.timezone || "America/Sao_Paulo",
    address: branchData.address || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Buscar todos os owners do tenant e adicioná-los como members da nova branch
  const membersRef = collection(db, TENANTS_COLLECTION, tenantId, "members");
  const membersSnapshot = await getDocs(membersRef);
  
  const ownerPromises = [];
  membersSnapshot.forEach((memberDoc) => {
    const memberData = memberDoc.data();
    if (memberData.role === "owner") {
      const branchMemberRef = doc(db, TENANTS_COLLECTION, tenantId, "branches", branchId, "members", memberDoc.id);
      ownerPromises.push(
        setDoc(branchMemberRef, {
          idUser: memberDoc.id,
          email: memberData.email || "",
          role: "admin",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
      
      // Atualizar branchIds e roleByBranch do owner
      const currentBranchIds = memberData.branchIds || [];
      const currentRoleByBranch = memberData.roleByBranch || {};
      ownerPromises.push(
        updateDoc(memberDoc.ref, {
          branchIds: [...currentBranchIds, branchId],
          roleByBranch: { ...currentRoleByBranch, [branchId]: "admin" },
        })
      );
    }
  });

  await Promise.all(ownerPromises);

  return branchId;
};

export const toggleTenantStatus = async (tenantId, status) => {
  const db = guardDb();
  const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
  await updateDoc(tenantRef, {
    status: status ? "active" : "inactive",
    updatedAt: serverTimestamp(),
  });
  return true;
};

export const toggleBranchStatus = async (tenantId, branchId, status) => {
  const db = guardDb();
  const branchRef = doc(db, TENANTS_COLLECTION, tenantId, "branches", branchId);
  await updateDoc(branchRef, {
    status: status ? "active" : "inactive",
    updatedAt: serverTimestamp(),
  });
  return true;
};

export const updateBranchBillingStatus = async (tenantId, branchId, billingStatus) => {
  const db = guardDb();
  const branchRef = doc(db, TENANTS_COLLECTION, tenantId, "branches", branchId);
  await updateDoc(branchRef, {
    billingStatus,
    updatedAt: serverTimestamp(),
  });
  return true;
};

export const updateTenant = async (tenantId, updates) => {
  const db = guardDb();
  const ref = doc(db, TENANTS_COLLECTION, tenantId);
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
