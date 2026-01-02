import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export type MemberPayload = {
  role: string;
  branchIds: string[];
  idBranch?: string;
  roleByBranch?: Record<string, string>;
};

export type Member = {
  role?: string;
  branchIds?: string[];
  idBranch?: string;
  roleByBranch?: Record<string, string>;
};

export const upsertMember = async (
  idTenant: string,
  uid: string,
  payload: MemberPayload
): Promise<void> => {
  if (!idTenant || !uid) {
    throw new Error("ID da academia e do usuario sao obrigatorios.");
  }

  if (!payload?.role) {
    throw new Error("Cargo do usuario e obrigatorio.");
  }

  if (!Array.isArray(payload.branchIds) || payload.branchIds.length === 0) {
    throw new Error("Selecione ao menos uma unidade.");
  }

  if (payload.idBranch && !payload.branchIds.includes(payload.idBranch)) {
    throw new Error("Unidade ativa deve estar dentro de branchIds.");
  }

  const resolvedIdBranch = payload.idBranch || payload.branchIds[0];
  if (!resolvedIdBranch) {
    throw new Error("Unidade ativa e obrigatoria.");
  }

  const db = getFirebaseDb();
  const memberRef = doc(db, "tenants", idTenant, "members", uid);

  const snapshot = await getDoc(memberRef);
  if (snapshot.exists()) {
    await updateDoc(memberRef, {
      ...payload,
      idTenant,
      idBranch: resolvedIdBranch,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(memberRef, {
    ...payload,
    idTenant,
    idBranch: resolvedIdBranch,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const fetchMember = async (idTenant: string, uid: string): Promise<Member | null> => {
  if (!idTenant || !uid) {
    return null;
  }

  const db = getFirebaseDb();
  const memberRef = doc(db, "tenants", idTenant, "members", uid);
  const snapshot = await getDoc(memberRef);
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as Member;
};
