import {
  collection,
  doc,
  getDoc,
  getDocs,
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

import { getFirebaseDb } from "../../services/firebase";

import { normalizeReceivablePayload, normalizeReceivableStatus } from "./receivables.domain";

import type { Receivable, ReceivablePayload, ReceivableStatus } from "./receivables.types";

type ReceivableDocData = Omit<Receivable, "id"> & {
  idTenant?: string;
  idBranch?: string;
  clientId?: string;
  kind?: string;
  anticipated?: boolean;
};

type ReceivableSnapshot =
  | QueryDocumentSnapshot<DocumentData, DocumentData>
  | DocumentSnapshot<DocumentData, DocumentData>;

const mapReceivableDoc = (
  idTenant: string,
  idBranch: string,
  fallbackClientId: string | null,
  id: string,
  data: ReceivableDocData
): Receivable => ({
  id,
  idTenant: data.idTenant || idTenant,
  idBranch: String(data.idBranch || idBranch),
  saleId: String(data.saleId || ""),
  clientId: data.clientId || fallbackClientId || "",
  consultantId: String(data.consultantId || ""),
  kind:
    data.kind === "manual"
      ? "manual"
      : data.kind === "card_installment"
      ? "card_installment"
      : undefined,
  amountCents: Number(data.amountCents || 0),
  amountPaidCents: Number(data.amountPaidCents || 0),
  dueDate: String(data.dueDate || "").slice(0, 10),
  status: normalizeReceivableStatus(data.status),
  anticipated: typeof data.anticipated === "boolean" ? data.anticipated : undefined,
  paidAt: data.paidAt,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const receivablesCollection = (idTenant: string, idBranch: string) => {
  const db = getFirebaseDb();
  return collection(db, "tenants", idTenant, "branches", idBranch, "receivables");
};

export const fetchSaleReceivables = async (
  idTenant: string,
  idBranch: string,
  saleId: string
): Promise<Receivable[]> => {
  if (!idTenant || !idBranch || !saleId) return [];
  const ref = receivablesCollection(idTenant, idBranch);
  const snapshot = await getDocs(query(ref, where("saleId", "==", saleId)));
  const list = snapshot.docs.map((d) =>
    mapReceivableDoc(idTenant, idBranch, null, d.id, d.data() as ReceivableDocData)
  );
  return list.sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
};

export const fetchClientReceivables = async (
  idTenant: string,
  idBranch: string,
  clientId: string,
  statuses?: ReceivableStatus[]
): Promise<Receivable[]> => {
  if (!idTenant || !idBranch || !clientId) return [];
  const ref = receivablesCollection(idTenant, idBranch);

  const normalizedStatuses = Array.isArray(statuses) ? statuses.filter(Boolean) : [];

  const q =
    normalizedStatuses.length > 0 && normalizedStatuses.length <= 10
      ? query(ref, where("clientId", "==", clientId), where("status", "in", normalizedStatuses))
      : query(ref, where("clientId", "==", clientId));

  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) =>
    mapReceivableDoc(idTenant, idBranch, clientId, d.id, d.data() as ReceivableDocData)
  );

  const filtered =
    normalizedStatuses.length > 10
      ? list.filter((r) => normalizedStatuses.includes(r.status))
      : list;

  return filtered.sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
};

export const createReceivable = async (payload: ReceivablePayload): Promise<string> => {
  const normalized = normalizeReceivablePayload(payload);
  if (!normalized.idTenant || !normalized.idBranch)
    throw new Error("Tenant/unidade não identificados.");
  const db = getFirebaseDb();
  const ref = doc(receivablesCollection(normalized.idTenant, normalized.idBranch));
  await setDoc(ref, {
    ...normalized,
    amountPaidCents: Math.max(0, Math.round(Number(normalized.amountPaidCents || 0))),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const applyReceivablePayment = async (
  idTenant: string,
  idBranch: string,
  receivableId: string,
  clientId: string,
  amountCents: number,
  paidAtIso: string
): Promise<void> => {
  if (!idTenant || !idBranch || !receivableId || !clientId) {
    throw new Error("Dados inválidos para pagamento.");
  }

  const paymentValue = Math.max(0, Number(amountCents || 0));
  if (paymentValue <= 0) {
    throw new Error("Valor do pagamento inválido.");
  }

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "receivables", receivableId);
  const clientRef = doc(db, "tenants", idTenant, "branches", idBranch, "clients", clientId);
  const salesRef = collection(db, "tenants", idTenant, "branches", idBranch, "sales");

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      throw new Error("Recebível não encontrado.");
    }

    const data = snap.data() as ReceivableDocData;
    const total = Number(data.amountCents || 0);
    const alreadyPaid = Number(data.amountPaidCents || 0);
    const remaining = Math.max(0, total - alreadyPaid);
    const applied = Math.min(remaining, paymentValue);
    const isManual = String(data.kind || "manual") === "manual";
    const saleId = String(data.saleId || "").trim();

    const saleRef = saleId ? doc(salesRef, saleId) : null;
    const saleSnap = applied > 0 && saleRef ? await tx.get(saleRef) : null;
    const clientSnap = applied > 0 && isManual ? await tx.get(clientRef) : null;

    const nextPaid = alreadyPaid + applied;
    const isPaid = nextPaid >= total && total > 0;

    tx.update(ref, {
      amountPaidCents: nextPaid,
      status: isPaid ? "paid" : "pending",
      paidAt: isPaid ? paidAtIso : data.paidAt,
      updatedAt: serverTimestamp(),
    });

    if (saleSnap?.exists()) {
      const saleData = saleSnap.data() as {
        paidTotalCents?: number;
        netPaidTotalCents?: number;
        remainingCents?: number;
        status?: string;
      };
      const salePaid = Number(saleData?.paidTotalCents || 0);
      const saleNetPaid = Number(saleData?.netPaidTotalCents ?? saleData?.paidTotalCents ?? 0);
      const saleRemaining = Number(saleData?.remainingCents || 0);
      const nextSalePaid = salePaid + applied;
      const nextSaleNetPaid = isManual ? saleNetPaid + applied : saleNetPaid;
      const nextSaleRemaining = Math.max(0, saleRemaining - applied);
      const nextSaleStatus = nextSaleRemaining > 0 ? "open" : "paid";

      tx.update(saleSnap.ref, {
        paidTotalCents: nextSalePaid,
        netPaidTotalCents: nextSaleNetPaid,
        remainingCents: nextSaleRemaining,
        status: nextSaleStatus,
        updatedAt: serverTimestamp(),
      });
    }

    if (clientSnap?.exists()) {
      const clientData = clientSnap.data() as { debtCents?: number } | undefined;
      const currentDebt = Number(clientData?.debtCents || 0);
      const nextDebt = Math.max(0, currentDebt - applied);
      tx.update(clientRef, {
        debtCents: nextDebt,
        updatedAt: serverTimestamp(),
      });
    }
  });
};

export const updateReceivableDueDate = async (
  idTenant: string,
  idBranch: string,
  receivableId: string,
  dueDateIso: string
): Promise<void> => {
  if (!idTenant || !idBranch || !receivableId) {
    throw new Error("Dados inválidos para atualizar vencimento.");
  }

  const dueDate = String(dueDateIso || "").slice(0, 10);
  if (!dueDate) {
    throw new Error("Data de vencimento inválida.");
  }

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "receivables", receivableId);
  await updateDoc(ref, {
    dueDate,
    updatedAt: serverTimestamp(),
  });
};

export const markReceivablePaid = async (
  idTenant: string,
  idBranch: string,
  receivableId: string,
  clientId: string,
  paidAtIso: string
): Promise<void> => {
  if (!idTenant || !idBranch || !receivableId || !clientId) {
    throw new Error("Dados inválidos para pagamento.");
  }

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "receivables", receivableId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Recebível não encontrado.");
  }

  const data = snap.data() as ReceivableDocData;
  const total = Number(data.amountCents || 0);

  await applyReceivablePayment(idTenant, idBranch, receivableId, clientId, total, paidAtIso);
};
