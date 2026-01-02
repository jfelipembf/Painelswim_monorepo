import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  setDoc,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { omitUndefined } from "../../utils/omitUndefined";
import { getFirebaseDb } from "../../services/firebase";

import { normalizeTaskTitle } from "./tasks.domain";

import type { Task, TaskPayload } from "./tasks.types";

type TaskDocData = TaskPayload & {
  idTenant?: string;
  idBranch?: string;
  createdByUserId?: string;
  completedBy?: Record<string, unknown>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type TaskSnapshot =
  | QueryDocumentSnapshot<DocumentData, DocumentData>
  | DocumentSnapshot<DocumentData, DocumentData>;

const mapTaskSnapshot = (idTenant: string, idBranch: string, snap: TaskSnapshot): Task => {
  const raw = snap.data() as TaskDocData | undefined;
  if (!raw) {
    throw new Error("Tarefa inválida.");
  }

  return {
    id: snap.id,
    idTenant: String(raw.idTenant || idTenant),
    idBranch: String(raw.idBranch || idBranch),
    title: String(raw.title || ""),
    description: raw.description !== undefined ? String(raw.description || "") : undefined,
    dueDateKey: String(raw.dueDateKey || ""),
    assigneeIds: Array.isArray(raw.assigneeIds) ? raw.assigneeIds.map((v) => String(v)) : [],
    clientId: raw.clientId ? String(raw.clientId) : undefined,
    status: raw.status !== undefined ? String(raw.status) : undefined,
    createdByUserId: raw.createdByUserId ? String(raw.createdByUserId) : undefined,
    completedBy: raw.completedBy || {},
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

export const createTask = async (
  idTenant: string,
  idBranch: string,
  payload: TaskPayload,
  options?: { createdByUserId?: string }
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Academia/unidade não identificadas.");

  const title = normalizeTaskTitle(payload.title);
  if (!title) throw new Error("Título é obrigatório.");

  const assigneeIds = Array.isArray(payload.assigneeIds)
    ? payload.assigneeIds.map((v) => String(v)).filter(Boolean)
    : [];

  if (assigneeIds.length === 0) throw new Error("Selecione ao menos 1 responsável.");

  const dueDateKey = String(payload.dueDateKey || "").slice(0, 10);
  if (!dueDateKey) throw new Error("Data da tarefa é obrigatória.");

  const db = getFirebaseDb();
  const tasksRef = collection(db, "tenants", idTenant, "branches", idBranch, "tasks");
  const ref = doc(tasksRef);

  await setDoc(ref, {
    idTenant,
    idBranch,
    title,
    description:
      payload.description !== undefined ? String(payload.description || "").trim() : undefined,
    dueDateKey,
    assigneeIds,
    clientId: payload.clientId ? String(payload.clientId) : undefined,
    status: payload.status !== undefined ? String(payload.status) : undefined,
    createdByUserId: options?.createdByUserId ? String(options.createdByUserId) : undefined,
    completedBy: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
};

export const fetchTasksForDate = async (params: {
  idTenant: string;
  idBranch: string;
  dueDateKey: string;
  assigneeId?: string | null;
}): Promise<Task[]> => {
  const { idTenant, idBranch, dueDateKey, assigneeId } = params;
  if (!idTenant || !idBranch || !dueDateKey) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "tasks");

  const clauses = [where("dueDateKey", "==", String(dueDateKey).slice(0, 10))];
  if (assigneeId) {
    clauses.push(where("assigneeIds", "array-contains", String(assigneeId)));
  }

  const snap = await getDocs(query(ref, ...clauses, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => mapTaskSnapshot(idTenant, idBranch, d));
};

export const setTaskStatus = async (params: {
  idTenant: string;
  idBranch: string;
  taskId: string;
  status?: string;
}): Promise<void> => {
  const { idTenant, idBranch, taskId, status } = params;
  if (!idTenant || !idBranch || !taskId) return;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "tasks", taskId);

  await updateDoc(
    ref,
    omitUndefined({
      status: status !== undefined ? String(status) : undefined,
      updatedAt: serverTimestamp(),
    }) as any
  );
};

export const markTaskCompletedForAssignee = async (params: {
  idTenant: string;
  idBranch: string;
  taskId: string;
  assigneeId: string;
  completed: boolean;
}): Promise<void> => {
  const { idTenant, idBranch, taskId, assigneeId, completed } = params;
  if (!idTenant || !idBranch || !taskId || !assigneeId) return;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "tasks", taskId);
  const field = `completedBy.${String(assigneeId)}`;

  await updateDoc(
    ref,
    omitUndefined({
      [field]: completed ? serverTimestamp() : undefined,
      updatedAt: serverTimestamp(),
    }) as any
  );
};

export const toggleTaskCompletedForAssignee = async (params: {
  idTenant: string;
  idBranch: string;
  taskId: string;
  assigneeId: string;
  completed: boolean;
}): Promise<void> => {
  return markTaskCompletedForAssignee(params);
};
