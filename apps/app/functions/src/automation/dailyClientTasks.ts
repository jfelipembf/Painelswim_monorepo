import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

import { chunk, parseBirthMonthDay, toDateKeyUtc } from "./utils";

type LoggerLike = Pick<typeof logger, "info" | "warn" | "error">;
type TaskKind = "birthday" | "contract_due" | "debt_due";

type TaskPreview = {
  kind: TaskKind;
  taskId: string;
  title: string;
  clientId?: string;
  assigneeId?: string;
  description?: string;
};

type PendingTask = {
  ref: admin.firestore.DocumentReference;
  data: Record<string, unknown>;
  kind: TaskKind;
  preview: TaskPreview;
};

type BranchSummary = {
  idBranch: string;
  plannedTasks: number;
  tasksByKind: Record<TaskKind, number>;
  previews: TaskPreview[];
};

type TenantSummary = {
  idTenant: string;
  branches: BranchSummary[];
};

type DailyClientTasksRunResult = {
  todayKey: string;
  tenants: TenantSummary[];
  errors: { idTenant: string; message: string }[];
};

type RunOptions = {
  date?: Date;
  tenantIds?: string[];
  branchIdsByTenant?: Record<string, string[]>;
  logger?: LoggerLike;
  dryRun?: boolean;
};

const normalizeIds = (values?: string[]): string[] | undefined => {
  if (!values) return undefined;
  const normalized = values.map((value) => String(value || "").trim()).filter(Boolean);
  return normalized.length ? normalized : undefined;
};

export const runDailyClientTasks = async (
  options: RunOptions = {}
): Promise<DailyClientTasksRunResult> => {
  const log = options.logger ?? logger;
  const db = admin.firestore();
  const refDate = options.date ?? new Date();
  const todayKey = toDateKeyUtc(refDate);
  const todayMonth = todayKey.slice(5, 7);
  const todayDay = todayKey.slice(8, 10);

  let tenantIds = normalizeIds(options.tenantIds);
  if (!tenantIds) {
    const tenantsSnap = await db.collection("tenants").get();
    tenantIds = tenantsSnap.docs.map((d) => d.id);
  }

  const result: DailyClientTasksRunResult = {
    todayKey,
    tenants: [],
    errors: [],
  };

  log.info("dailyClientTasks:start", {
    todayKey,
    tenants: tenantIds.length,
    dryRun: Boolean(options.dryRun),
  });

  for (const idTenant of tenantIds) {
    try {
      const tenantSummary: TenantSummary = {
        idTenant,
        branches: [],
      };

      const branchesSnap = await db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .get();

      for (const branchDoc of branchesSnap.docs) {
        const idBranch = String(branchDoc.id || "");
        if (!idBranch) continue;

        const allowedBranches = normalizeIds(options.branchIdsByTenant?.[idTenant]);
        if (allowedBranches && !allowedBranches.includes(idBranch)) continue;

        const staffSnap = await db
          .collection("tenants")
          .doc(idTenant)
          .collection("branches")
          .doc(idBranch)
          .collection("staff")
          .get();

        const assigneeByAuthUid = new Map<string, string>();
        staffSnap.docs.forEach((doc) => {
          const data = doc.data() as admin.firestore.DocumentData;
          const authUid = String(data?.authUid || "");
          if (authUid) assigneeByAuthUid.set(authUid, doc.id);
        });

        if (assigneeByAuthUid.size === 0) continue;

        const tasksRef = db
          .collection("tenants")
          .doc(idTenant)
          .collection("branches")
          .doc(idBranch)
          .collection("tasks");

        const existingSnap = await tasksRef.where("dueDateKey", "==", todayKey).get();
        const existingIds = new Set(existingSnap.docs.map((doc) => doc.id));

        const tasksToCreate: PendingTask[] = [];

        const clientsSnap = await db
          .collection("tenants")
          .doc(idTenant)
          .collection("branches")
          .doc(idBranch)
          .collection("clients")
          .get();

        clientsSnap.docs.forEach((doc) => {
          const data = doc.data() as admin.firestore.DocumentData;
          const birthParts = parseBirthMonthDay(String(data?.birthDate || ""));
          if (!birthParts) return;
          const isBirthdayToday = birthParts.month === todayMonth && birthParts.day === todayDay;
          if (!isBirthdayToday) {
            return;
          }

          const createdByUserId = String(data?.createdByUserId || "");
          if (!createdByUserId) return;
          const assigneeId = assigneeByAuthUid.get(createdByUserId);
          if (!assigneeId) return;

          const taskId = `birthday_${doc.id}_${todayKey}`;
          if (existingIds.has(taskId)) return;
          existingIds.add(taskId);

          const name = `${String(data?.firstName || "").trim()} ${String(data?.lastName || "").trim()}`
            .trim()
            .replace(/\s+/g, " ");
          const title = `Aniversário: ${name || "Aluno"}`;

          tasksToCreate.push({
            ref: tasksRef.doc(taskId),
            data: {
              idTenant,
              idBranch,
              title,
              description: "Aniversário do aluno hoje.",
              dueDateKey: todayKey,
              assigneeIds: [assigneeId],
              clientId: doc.id,
              urgency: "low",
              type: "Aniversário",
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            kind: "birthday",
            preview: {
              kind: "birthday",
              taskId,
              title,
              clientId: doc.id,
              assigneeId,
              description: "Aniversário do aluno hoje.",
            },
          });
        });

        const membershipsSnap = await db
          .collectionGroup("memberships")
          .where("idTenant", "==", idTenant)
          .where("idBranch", "==", idBranch)
          .where("endAt", "==", todayKey)
          .get();

        const memberships: {
          id: string;
          clientId: string;
          planName: string;
        }[] = [];
        const membershipClientIds = new Set<string>();

        membershipsSnap.docs.forEach((doc) => {
          const data = doc.data() as admin.firestore.DocumentData;
          const status = String(data?.status || "");
          if (status === "canceled" || status === "expired") return;

          const clientId = String(data?.clientId || "");
          if (!clientId) return;
          memberships.push({
            id: doc.id,
            clientId,
            planName: String(data?.planName || "Plano"),
          });
          membershipClientIds.add(clientId);
        });

        const clientById = new Map<string, admin.firestore.DocumentData>();
        const clientIds = Array.from(membershipClientIds);
        for (const group of chunk(clientIds, 100)) {
          const refs = group.map((clientId) =>
            db
              .collection("tenants")
              .doc(idTenant)
              .collection("branches")
              .doc(idBranch)
              .collection("clients")
              .doc(clientId)
          );
          const docs = refs.length ? await db.getAll(...refs) : [];
          docs.forEach((snap) => {
            if (!snap.exists) return;
            const data = snap.data();
            if (!data) return;
            clientById.set(snap.id, data);
          });
        }

        memberships.forEach((membership) => {
          const client = clientById.get(membership.clientId);
          if (!client) return;

          const createdByUserId = String(client?.createdByUserId || "");
          if (!createdByUserId) return;
          const assigneeId = assigneeByAuthUid.get(createdByUserId);
          if (!assigneeId) return;

          const taskId = `contract_due_${membership.id}_${todayKey}`;
          if (existingIds.has(taskId)) return;
          existingIds.add(taskId);

          const name = `${String(client?.firstName || "").trim()} ${String(client?.lastName || "").trim()}`
            .trim()
            .replace(/\s+/g, " ");

          const title = `Vencimento de plano: ${membership.planName}`;

          tasksToCreate.push({
            ref: tasksRef.doc(taskId),
            data: {
              idTenant,
              idBranch,
              title,
              description: `${name || "Aluno"} com vencimento do plano hoje.`,
              dueDateKey: todayKey,
              assigneeIds: [assigneeId],
              clientId: membership.clientId,
              urgency: "medium",
              type: "Vencimento",
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            kind: "contract_due",
            preview: {
              kind: "contract_due",
              taskId,
              title,
              clientId: membership.clientId,
              assigneeId,
              description: `${name || "Aluno"} com vencimento do plano hoje.`,
            },
          });
        });

        const receivablesRef = db
          .collection("tenants")
          .doc(idTenant)
          .collection("branches")
          .doc(idBranch)
          .collection("receivables");

        const receivablesSnap = await receivablesRef
          .where("kind", "==", "manual")
          .where("status", "in", ["pending", "overdue"])
          .where("dueDate", "==", todayKey)
          .get();

        receivablesSnap.docs.forEach((doc) => {
          const data = doc.data() as admin.firestore.DocumentData;
          const clientId = String(data?.clientId || "");
          if (!clientId) return;

          const consultantAuthUid = String(data?.consultantId || "");
          if (!consultantAuthUid) return;
          const assigneeId = assigneeByAuthUid.get(consultantAuthUid);
          if (!assigneeId) return;

          const taskId = `debt_due_${doc.id}_${todayKey}`;
          if (existingIds.has(taskId)) return;
          existingIds.add(taskId);

          const client = clientById.get(clientId);
          const name = `${String(client?.firstName || "").trim()} ${String(client?.lastName || "").trim()}`
            .trim()
            .replace(/\s+/g, " ");

          const amountCents = Number(data?.amountCents || 0);
          const paidCents = Number(data?.amountPaidCents || 0);
          const openCents = Math.max(0, amountCents - paidCents);

          const description = [
            "Saldo prometido para hoje.",
            `Em aberto: ${openCents} centavos.`,
          ].join(" ");

          const title = `Cobrança saldo devedor: ${name || "Aluno"}`;

          tasksToCreate.push({
            ref: tasksRef.doc(taskId),
            data: {
              idTenant,
              idBranch,
              title,
              description,
              dueDateKey: todayKey,
              assigneeIds: [assigneeId],
              clientId,
              urgency: "high",
              type: "Cobrança",
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            kind: "debt_due",
            preview: {
              kind: "debt_due",
              taskId,
              title,
              clientId,
              assigneeId,
              description,
            },
          });
        });

        if (!options.dryRun && tasksToCreate.length) {
          for (const group of chunk(tasksToCreate, 400)) {
            const batch = db.batch();
            group.forEach((task) => {
              batch.set(task.ref, task.data);
            });
            await batch.commit();
          }
        }

        const tasksByKind: Record<TaskKind, number> = {
          birthday: 0,
          contract_due: 0,
          debt_due: 0,
        };
        tasksToCreate.forEach((task) => {
          tasksByKind[task.kind] += 1;
        });

        tenantSummary.branches.push({
          idBranch,
          plannedTasks: tasksToCreate.length,
          tasksByKind,
          previews: tasksToCreate.map((task) => task.preview),
        });

        log.info("dailyClientTasks:branch_done", {
          idTenant,
          idBranch,
          created: options.dryRun ? 0 : tasksToCreate.length,
          planned: tasksToCreate.length,
          dryRun: Boolean(options.dryRun),
        });
      }

      result.tenants.push(tenantSummary);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      log.error("dailyClientTasks:tenant_error", {
        idTenant,
        error: message,
      });
      result.errors.push({ idTenant, message });
    }
  }

  log.info("dailyClientTasks:done", { todayKey, dryRun: Boolean(options.dryRun) });

  return result;
};

export const dailyClientTasks = onSchedule(
  {
    schedule: "every day 05:00",
    timeZone: "America/Sao_Paulo",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    await runDailyClientTasks({ logger });
  }
);
