import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { omitUndefined } from "../../utils/omitUndefined";

import { getFirebaseDb } from "../../services/firebase";

import { emptyAddress, normalizeClientPayload } from "./clients.domain";

import type { Client, ClientPayload } from "./clients.types";

type ClientDocData = ClientPayload & {
  idTenant?: string;
  idBranch?: string;
  friendlyId?: string;
  debtCents?: number;
  activeMembershipId?: string;
  scheduledMembershipId?: string;
  activeSaleId?: string;
  access?: {
    allowCrossBranchAccess?: boolean;
    allowedBranchIds?: string[];
  };
  lastPresenceDateKey?: string;
  abandonmentRisk?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type ClientSnapshot =
  | QueryDocumentSnapshot<DocumentData, DocumentData>
  | DocumentSnapshot<DocumentData, DocumentData>;

const mapClientSnapshot = (
  idTenant: string,
  idBranch: string,
  snapshot: ClientSnapshot
): Client => {
  const raw = snapshot.data() as ClientDocData | undefined;
  if (!raw) {
    throw new Error("Cliente inválido.");
  }

  return {
    id: snapshot.id,
    idTenant: String(raw.idTenant || idTenant),
    idBranch: String(raw.idBranch || idBranch),
    firstName: String(raw.firstName || ""),
    lastName: String(raw.lastName || ""),
    gender: String(raw.gender || ""),
    birthDate: String(raw.birthDate || ""),
    email: String(raw.email || ""),
    photoUrl: raw.photoUrl,
    phone: raw.phone,
    whatsapp: raw.whatsapp,
    responsibleName: raw.responsibleName,
    responsiblePhone: raw.responsiblePhone,
    notes: raw.notes,
    status: raw.status,
    createdByUserId: raw.createdByUserId ? String(raw.createdByUserId) : undefined,
    address: raw.address || emptyAddress(),
    friendlyId: raw.friendlyId,
    debtCents: typeof raw.debtCents === "number" ? raw.debtCents : undefined,
    activeMembershipId: raw.activeMembershipId,
    scheduledMembershipId: raw.scheduledMembershipId,
    activeSaleId: raw.activeSaleId,
    access: raw.access,
    lastPresenceDateKey: raw.lastPresenceDateKey
      ? String(raw.lastPresenceDateKey).slice(0, 10)
      : undefined,
    abandonmentRisk: typeof raw.abandonmentRisk === "boolean" ? raw.abandonmentRisk : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const toFriendlyId = (value: number): string => String(Math.max(0, value)).padStart(4, "0");

export const createClient = async (
  idTenant: string,
  idBranch: string,
  payload: ClientPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Academia/unidade não identificadas.");
  const normalized = normalizeClientPayload(payload);
  if (!normalized.firstName || !normalized.lastName)
    throw new Error("Nome e sobrenome são obrigatórios.");

  const db = getFirebaseDb();
  const clientsRef = collection(db, "tenants", idTenant, "branches", idBranch, "clients");
  const counterRef = doc(db, "tenants", idTenant, "branches", idBranch, "counters", "clients");
  const clientRef = doc(clientsRef);

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const nextRaw = counterSnap.exists()
      ? (counterSnap.data() as { nextFriendlyId?: number }).nextFriendlyId
      : undefined;
    const next = typeof nextRaw === "number" && Number.isFinite(nextRaw) ? nextRaw : 1;
    const friendlyId = toFriendlyId(next);

    tx.set(
      counterRef,
      {
        nextFriendlyId: next + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const clientData = omitUndefined({
      idTenant,
      idBranch,
      friendlyId,
      ...normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.set(clientRef, clientData);
  });

  return clientRef.id;
};

export const fetchClients = async (idTenant: string, idBranch: string): Promise<Client[]> => {
  if (!idTenant || !idBranch) return [];
  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "clients");
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => mapClientSnapshot(idTenant, idBranch, d));
};

export const fetchClientById = async (
  idTenant: string,
  idBranch: string,
  clientId: string
): Promise<Client | null> => {
  if (!idTenant || !idBranch || !clientId) return null;
  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "clients", clientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapClientSnapshot(idTenant, idBranch, snap);
};

export const updateClient = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  payload: Partial<ClientPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !clientId) throw new Error("Cliente não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "clients", clientId);

  const sanitizeString = (value?: string) =>
    value !== undefined ? String(value).trim() : undefined;

  const sanitized = {
    firstName: sanitizeString(payload.firstName),
    lastName: sanitizeString(payload.lastName),
    gender: sanitizeString(payload.gender),
    birthDate: sanitizeString(payload.birthDate),
    email: sanitizeString(payload.email),
    photoUrl: payload.photoUrl ?? undefined,
    phone: sanitizeString(payload.phone),
    whatsapp: sanitizeString(payload.whatsapp),
    responsibleName: sanitizeString(payload.responsibleName),
    responsiblePhone: sanitizeString(payload.responsiblePhone),
    notes: payload.notes ?? undefined,
    status: payload.status,
    address: payload.address
      ? {
          zipCode: sanitizeString(payload.address.zipCode) || "",
          state: sanitizeString(payload.address.state) || "",
          city: sanitizeString(payload.address.city) || "",
          neighborhood: sanitizeString(payload.address.neighborhood) || "",
          address: sanitizeString(payload.address.address) || "",
          number: sanitizeString(payload.address.number) || "",
        }
      : undefined,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(ref, omitUndefined(sanitized));
};

export const searchClientsByName = async (
  idTenant: string,
  idBranch: string,
  namePrefix: string
): Promise<Client[]> => {
  if (!idTenant || !idBranch) return [];
  const prefix = String(namePrefix || "").trim();
  if (!prefix) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "clients");

  const snap = await getDocs(
    query(ref, where("firstName", ">=", prefix), where("firstName", "<=", `${prefix}\uf8ff`))
  );

  return snap.docs.map((d) => mapClientSnapshot(idTenant, idBranch, d));
};
