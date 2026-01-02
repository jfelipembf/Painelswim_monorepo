import {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import {
  mapCollaboratorDoc,
  normalizeCollaboratorPayload,
  normalizeCollaboratorUpdatePayload,
} from "./collaborators.domain";

import type {
  Collaborator,
  CollaboratorPayload,
  CollaboratorUpdatePayload,
} from "./collaborators.types";
import { omitUndefined } from "../../utils/omitUndefined";

type CollaboratorSnapshot =
  | QueryDocumentSnapshot<DocumentData, DocumentData>
  | DocumentSnapshot<DocumentData, DocumentData>;

type CollaboratorDocData = Omit<Collaborator, "id"> & {
  idTenant?: string;
  idBranch?: string;
};

const mapSnapshot = (
  snapshot: CollaboratorSnapshot,
  idTenant: string,
  idBranch: string
): Collaborator => {
  const raw = snapshot.data() as CollaboratorDocData | undefined;
  if (!raw) {
    throw new Error("Colaborador inválido.");
  }
  return mapCollaboratorDoc(idTenant, idBranch, snapshot.id, raw as any);
};

const staffCollection = (idTenant: string, idBranch: string) => {
  const db = getFirebaseDb();
  return collection(db, "tenants", idTenant, "branches", idBranch, "staff");
};

export const createCollaborator = async (
  idTenant: string,
  idBranch: string,
  payload: CollaboratorPayload
): Promise<string> => {
  if (!idTenant || !idBranch) {
    throw new Error("ID da academia e unidade são obrigatórios.");
  }

  const normalized = normalizeCollaboratorPayload(payload);
  if (!normalized.name?.trim()) throw new Error("Nome é obrigatório.");
  if (!normalized.email?.trim()) throw new Error("Email é obrigatório.");

  const collaboratorData = omitUndefined({
    idTenant,
    idBranch,
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const ref = await addDoc(staffCollection(idTenant, idBranch), collaboratorData);

  return ref.id;
};

export const updateCollaborator = async (
  idTenant: string,
  idBranch: string,
  staffId: string,
  payload: CollaboratorUpdatePayload
): Promise<void> => {
  if (!idTenant || !idBranch || !staffId) {
    throw new Error("ID da academia, unidade e colaborador são obrigatórios.");
  }

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "staff", staffId);

  const updateData = omitUndefined({
    ...normalizeCollaboratorUpdatePayload(payload),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, updateData);
};

export const fetchCollaborators = async (
  idTenant: string,
  idBranch?: string | null
): Promise<Collaborator[]> => {
  if (!idTenant) return [];

  const db = getFirebaseDb();

  if (idBranch) {
    const snap = await getDocs(staffCollection(idTenant, idBranch));
    return snap.docs.map((d) => mapSnapshot(d, idTenant, idBranch));
  }

  const snap = await getDocs(
    query(collectionGroup(db, "staff"), where("idTenant", "==", idTenant))
  );
  return snap.docs.map((d) => {
    const raw = d.data() as CollaboratorDocData;
    const branch = String(raw.idBranch || "");
    return mapCollaboratorDoc(idTenant, branch, d.id, raw as any);
  });
};

export const fetchCollaboratorByAuthUid = async (
  idTenant: string,
  authUid: string
): Promise<Collaborator | null> => {
  if (!idTenant || !authUid) return null;

  const db = getFirebaseDb();
  const staffQuery = query(
    collectionGroup(db, "staff"),
    where("idTenant", "==", idTenant),
    where("authUid", "==", authUid),
    limit(1)
  );

  const snapshot = await getDocs(staffQuery);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  const raw = docSnap.data() as CollaboratorDocData;
  const idBranch = String(raw.idBranch || "");

  return mapCollaboratorDoc(idTenant, idBranch, docSnap.id, raw as any);
};

export const fetchCollaboratorByEmail = async (
  idTenant: string,
  email: string
): Promise<Collaborator | null> => {
  if (!idTenant || !email) return null;

  const db = getFirebaseDb();
  const staffQuery = query(
    collectionGroup(db, "staff"),
    where("idTenant", "==", idTenant),
    where("email", "==", email),
    limit(1)
  );

  const snapshot = await getDocs(staffQuery);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  const raw = docSnap.data() as CollaboratorDocData;
  const idBranch = String(raw.idBranch || "");

  return mapCollaboratorDoc(idTenant, idBranch, docSnap.id, raw as any);
};

export const fetchCollaboratorById = async (
  idTenant: string,
  idBranch: string,
  staffId: string
): Promise<Collaborator | null> => {
  if (!idTenant || !idBranch || !staffId) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "staff", staffId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;

  return mapSnapshot(snapshot, idTenant, idBranch);
};
