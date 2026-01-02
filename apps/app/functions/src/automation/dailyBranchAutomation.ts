import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

import { hourKeyFromAttendance } from "../shared";

import { loadBranchSettingsMap, resolveBranchSettings } from "./branchSettings";
import { addDaysDateKeyUtc, chunk, diffDaysDateKeyUtc, toDateKeyUtc } from "./utils";

const upsertDailyAttendanceSummary = async (
  db: admin.firestore.Firestore,
  idTenant: string,
  idBranch: string,
  dateKey: string
): Promise<void> => {
  if (!idTenant || !idBranch || !dateKey) return;

  const attendanceSnap = await db
    .collectionGroup("attendance")
    .where("idTenant", "==", idTenant)
    .where("idBranch", "==", idBranch)
    .where("sessionDateKey", "==", dateKey)
    .get();

  const byHour: Record<string, number> = {};
  let presentCount = 0;
  let absentCount = 0;

  attendanceSnap.docs.forEach((doc) => {
    const data = doc.data() as admin.firestore.DocumentData;
    const status = String(data?.status || "");
    if (status === "present") {
      presentCount += 1;
      const hourKey = hourKeyFromAttendance(data);
      if (hourKey) {
        byHour[hourKey] = (byHour[hourKey] || 0) + 1;
      }
    } else if (status === "absent") {
      absentCount += 1;
    }
  });

  const summaryRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("dailySummaries")
    .doc(dateKey);

  await summaryRef.set(
    {
      idTenant,
      idBranch,
      dateKey,
      attendance: {
        presentCount: Math.max(0, presentCount),
        absentCount: Math.max(0, absentCount),
        byHour,
      },
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

const autoCloseCashierForDay = async (
  db: admin.firestore.Firestore,
  idTenant: string,
  idBranch: string,
  dateKey: string
): Promise<void> => {
  if (!idTenant || !idBranch || !dateKey) return;

  const closureRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("cashierClosures")
    .doc(dateKey);

  const existingSnap = await closureRef.get();
  if (existingSnap.exists && existingSnap.data()?.closedAt) return;

  const summarySnap = await db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("dailySummaries")
    .doc(dateKey)
    .get();

  const summary = summarySnap.exists ? (summarySnap.data() as admin.firestore.DocumentData) : {};
  const salesPaidCents = Number(summary?.sales?.paidTotalCents || 0);
  const cashIncomeCents = Number(summary?.cashMovements?.incomeCents || 0);
  const cashExpenseCents = Number(summary?.cashMovements?.expenseCents || 0);
  const totalIncomeCents = salesPaidCents + cashIncomeCents;
  const netCents = totalIncomeCents - cashExpenseCents;

  await closureRef.set(
    {
      idTenant,
      idBranch,
      dateKey,
      totals: {
        salesPaidCents: Math.max(0, salesPaidCents),
        cashIncomeCents: Math.max(0, cashIncomeCents),
        cashExpenseCents: Math.max(0, cashExpenseCents),
        totalIncomeCents: Math.max(0, totalIncomeCents),
        netCents,
      },
      autoClosed: true,
      closedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

const updateAbandonmentRiskForBranch = async (
  db: admin.firestore.Firestore,
  idTenant: string,
  idBranch: string,
  todayKey: string,
  abandonmentRiskDays: number
): Promise<void> => {
  if (!idTenant || !idBranch || !todayKey) return;
  const days = Math.max(0, Number(abandonmentRiskDays || 0));
  if (!days) return;

  const clientsSnap = await db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("clients")
    .where("status", "==", "active")
    .get();

  const updates: { ref: admin.firestore.DocumentReference; risk: boolean }[] = [];

  clientsSnap.docs.forEach((doc) => {
    const data = doc.data() as admin.firestore.DocumentData;
    const lastPresence = String(data?.lastPresenceDateKey || "").slice(0, 10);
    const currentRisk = Boolean(data?.abandonmentRisk);
    let nextRisk = false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(lastPresence)) {
      const daysWithout = diffDaysDateKeyUtc(lastPresence, todayKey);
      nextRisk = daysWithout >= days;
    }
    if (currentRisk !== nextRisk) {
      updates.push({ ref: doc.ref, risk: nextRisk });
    }
  });

  for (const group of chunk(updates, 400)) {
    const batch = db.batch();
    group.forEach((u) => {
      batch.update(u.ref, {
        abandonmentRisk: u.risk,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
};

const cancelOverdueContractsForBranch = async (
  db: admin.firestore.Firestore,
  idTenant: string,
  idBranch: string,
  todayKey: string,
  cancelAfterDays: number
): Promise<void> => {
  if (!idTenant || !idBranch || !todayKey) return;
  const days = Math.max(0, Number(cancelAfterDays || 0));
  if (!days) return;

  const thresholdKey = addDaysDateKeyUtc(todayKey, -days);
  const receivablesRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("receivables");

  const receivablesSnap = await receivablesRef
    .where("status", "in", ["pending", "overdue"])
    .where("dueDate", "<=", thresholdKey)
    .get();

  const receivablesToCancel: admin.firestore.DocumentReference[] = [];
  const saleIds = new Set<string>();

  receivablesSnap.docs.forEach((doc) => {
    const data = doc.data() as admin.firestore.DocumentData;
    const dueDate = String(data?.dueDate || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return;
    const overdueDays = diffDaysDateKeyUtc(dueDate, todayKey);
    if (overdueDays < days) return;
    const paidCents = Number(data?.amountPaidCents || 0);
    if (paidCents > 0) return;
    receivablesToCancel.push(doc.ref);
    const saleId = String(data?.saleId || "");
    if (saleId) saleIds.add(saleId);
  });

  for (const group of chunk(receivablesToCancel, 400)) {
    const batch = db.batch();
    group.forEach((ref) => {
      batch.update(ref, {
        status: "canceled",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  const saleIdList = Array.from(saleIds);
  for (const group of chunk(saleIdList, 10)) {
    const membershipsSnap = await db
      .collectionGroup("memberships")
      .where("idTenant", "==", idTenant)
      .where("idBranch", "==", idBranch)
      .where("saleId", "in", group)
      .get();

    const membershipRefs: admin.firestore.DocumentReference[] = [];
    membershipsSnap.docs.forEach((doc) => {
      const data = doc.data() as admin.firestore.DocumentData;
      const status = String(data?.status || "");
      if (status === "canceled" || status === "expired") return;
      membershipRefs.push(doc.ref);
    });

    for (const refs of chunk(membershipRefs, 400)) {
      const batch = db.batch();
      refs.forEach((ref) => {
        batch.update(ref, {
          status: "canceled",
          statusDateKey: todayKey,
          endAt: todayKey,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
  }
};

export const dailyBranchAutomation = onSchedule(
  {
    schedule: "every day 00:10",
    timeZone: "America/Sao_Paulo",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const db = admin.firestore();
    const todayKey = toDateKeyUtc(new Date());
    const summaryDateKey = addDaysDateKeyUtc(todayKey, -1);

    const tenantsSnap = await db.collection("tenants").get();
    const tenantIds = tenantsSnap.docs.map((d) => d.id);

    logger.info("dailyBranchAutomation:start", {
      todayKey,
      summaryDateKey,
      tenants: tenantIds.length,
    });

    for (const idTenant of tenantIds) {
      try {
        const { branchDocs, settingsByBranch } = await loadBranchSettingsMap(db, idTenant);

        for (const branchDoc of branchDocs) {
          const idBranch = String(branchDoc.id || "");
          if (!idBranch) continue;

          const settings = resolveBranchSettings(settingsByBranch, idTenant, idBranch);

          if (settings.attendanceSummaryAtMidnight) {
            await upsertDailyAttendanceSummary(db, idTenant, idBranch, summaryDateKey);
          }

          if (settings.autoCloseCashierAtMidnight) {
            await autoCloseCashierForDay(db, idTenant, idBranch, summaryDateKey);
          }

          if (settings.abandonmentRiskEnabled) {
            await updateAbandonmentRiskForBranch(
              db,
              idTenant,
              idBranch,
              todayKey,
              settings.abandonmentRiskDays
            );
          }

          if (settings.cancelContractsAfterDaysWithoutPayment) {
            await cancelOverdueContractsForBranch(
              db,
              idTenant,
              idBranch,
              todayKey,
              settings.cancelContractsAfterDaysWithoutPayment
            );
          }
        }

        logger.info("dailyBranchAutomation:tenant_done", {
          idTenant,
          branchesScanned: branchDocs.length,
        });
      } catch (e: unknown) {
        logger.error("dailyBranchAutomation:tenant_error", {
          idTenant,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    logger.info("dailyBranchAutomation:done", { todayKey });
  }
);
