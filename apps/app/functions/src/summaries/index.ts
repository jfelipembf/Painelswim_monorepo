import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

import {
  dateKeyFromSessionId,
  dateKeyFromTimestamp,
  expandFieldPaths,
  hourKeyFromAttendance,
  inc,
  toDayKey,
  toMonthKey,
} from "../shared";

type MonthlySummaryDeltaParams = {
  idTenant: string;
  idBranch: string;
  monthKey: string;
  updates: Record<string, FieldValue>;
};

type DailySummaryDeltaParams = {
  idTenant: string;
  idBranch: string;
  dateKey: string;
  updates: Record<string, FieldValue>;
};

const updateMonthlySummaryDelta = async ({
  idTenant,
  idBranch,
  monthKey,
  updates,
}: MonthlySummaryDeltaParams) => {
  if (!idTenant || !idBranch || !monthKey) return;

  const db = admin.firestore();
  const ref = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("monthlySummaries")
    .doc(monthKey);

  const normalizedUpdates = expandFieldPaths(updates);

  await ref.set(
    {
      idTenant,
      idBranch,
      monthKey,
      ...normalizedUpdates,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

const updateDailySummaryDelta = async ({
  idTenant,
  idBranch,
  dateKey,
  updates,
}: DailySummaryDeltaParams) => {
  if (!idTenant || !idBranch || !dateKey) return;

  const db = admin.firestore();
  const ref = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("dailySummaries")
    .doc(dateKey);

  const normalizedUpdates = expandFieldPaths(updates);

  await ref.set(
    {
      idTenant,
      idBranch,
      dateKey,
      ...normalizedUpdates,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

const salesDelta = (
  before: admin.firestore.DocumentData | undefined,
  after: admin.firestore.DocumentData | undefined
) => {
  const b = before || {};
  const a = after || {};
  const bNet = Number(b.netTotalCents || 0);
  const aNet = Number(a.netTotalCents || 0);
  const bDisc = Number(b.discountCents || 0);
  const aDisc = Number(a.discountCents || 0);
  const bFees = Number(b.feesCents || 0);
  const aFees = Number(a.feesCents || 0);
  const bPaid = Number(b.paidTotalCents || 0);
  const aPaid = Number(a.paidTotalCents || 0);
  const bRem = Number(b.remainingCents || 0);
  const aRem = Number(a.remainingCents || 0);
  const bCount = before ? 1 : 0;
  const aCount = after ? 1 : 0;
  return {
    count: aCount - bCount,
    net: aNet - bNet,
    disc: aDisc - bDisc,
    fees: aFees - bFees,
    paid: aPaid - bPaid,
    rem: aRem - bRem,
  };
};

const cashMovementDelta = (
  before: admin.firestore.DocumentData | undefined,
  after: admin.firestore.DocumentData | undefined
) => {
  const b = before || {};
  const a = after || {};
  const bType = String(b.type || "");
  const aType = String(a.type || "");
  const bAmount = Number(b.amountCents || 0);
  const aAmount = Number(a.amountCents || 0);

  const income = (t: string, v: number) => (t === "income" ? v : 0);
  const expense = (t: string, v: number) => (t === "expense" ? v : 0);

  return {
    income: income(aType, aAmount) - income(bType, bAmount),
    expense: expense(aType, aAmount) - expense(bType, bAmount),
  };
};

const attendanceDelta = (
  before: admin.firestore.DocumentData | undefined,
  after: admin.firestore.DocumentData | undefined
) => {
  const bStatus = String(before?.status || "");
  const aStatus = String(after?.status || "");
  const bPresent = bStatus === "present" ? 1 : 0;
  const aPresent = aStatus === "present" ? 1 : 0;
  return aPresent - bPresent;
};

export const monthlySummaryFromSale = onDocumentWritten(
  { document: "tenants/{idTenant}/branches/{idBranch}/sales/{saleId}" },
  async (event) => {
    const idTenant = String(event.params.idTenant || "");
    const idBranchParam = String(event.params.idBranch || "");
    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;
    if (!before && !after) return;

    const beforeBranch = String(before?.idBranch || idBranchParam || "");
    const afterBranch = String(after?.idBranch || idBranchParam || "");
    const beforeMonth = toMonthKey(String(before?.dateKey || ""));
    const afterMonth = toMonthKey(String(after?.dateKey || ""));

    // Se mudou unidade ou mês (raro), aplica delta negativo no antigo e
    // positivo no novo.
    const movedBranchOrMonth = beforeBranch !== afterBranch || beforeMonth !== afterMonth;
    if (before && movedBranchOrMonth) {
      const d = salesDelta(before, undefined);
      await updateMonthlySummaryDelta({
        idTenant,
        idBranch: beforeBranch,
        monthKey: beforeMonth,
        updates: {
          "sales.count": inc(d.count),
          "sales.netTotalCents": inc(d.net),
          "sales.discountCents": inc(d.disc),
          "sales.feesCents": inc(d.fees),
          "sales.paidTotalCents": inc(d.paid),
          "sales.remainingCents": inc(d.rem),
        },
      });
    }

    if (after) {
      const d = salesDelta(before, after);
      await updateMonthlySummaryDelta({
        idTenant,
        idBranch: afterBranch,
        monthKey: afterMonth,
        updates: {
          "sales.count": inc(d.count),
          "sales.netTotalCents": inc(d.net),
          "sales.discountCents": inc(d.disc),
          "sales.feesCents": inc(d.fees),
          "sales.paidTotalCents": inc(d.paid),
          "sales.remainingCents": inc(d.rem),
        },
      });
    } else if (before) {
      const d = salesDelta(before, undefined);
      await updateMonthlySummaryDelta({
        idTenant,
        idBranch: beforeBranch,
        monthKey: beforeMonth,
        updates: {
          "sales.count": inc(d.count),
          "sales.netTotalCents": inc(d.net),
          "sales.discountCents": inc(d.disc),
          "sales.feesCents": inc(d.fees),
          "sales.paidTotalCents": inc(d.paid),
          "sales.remainingCents": inc(d.rem),
        },
      });
    }
  }
);

export const dailySummaryFromSale = onDocumentWritten(
  { document: "tenants/{idTenant}/branches/{idBranch}/sales/{saleId}" },
  async (event) => {
    const idTenant = String(event.params.idTenant || "");
    const idBranchParam = String(event.params.idBranch || "");
    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;
    if (!before && !after) return;

    const beforeBranch = String(before?.idBranch || idBranchParam || "");
    const afterBranch = String(after?.idBranch || idBranchParam || "");
    const beforeDay = toDayKey(String(before?.dateKey || ""));
    const afterDay = toDayKey(String(after?.dateKey || ""));

    const movedBranchOrDay = beforeBranch !== afterBranch || beforeDay !== afterDay;
    if (before && movedBranchOrDay) {
      const d = salesDelta(before, undefined);
      await updateDailySummaryDelta({
        idTenant,
        idBranch: beforeBranch,
        dateKey: beforeDay,
        updates: {
          "sales.count": inc(d.count),
          "sales.netTotalCents": inc(d.net),
          "sales.discountCents": inc(d.disc),
          "sales.feesCents": inc(d.fees),
          "sales.paidTotalCents": inc(d.paid),
          "sales.remainingCents": inc(d.rem),
        },
      });
    }

    if (after) {
      const d = salesDelta(before, after);
      await updateDailySummaryDelta({
        idTenant,
        idBranch: afterBranch,
        dateKey: afterDay,
        updates: {
          "sales.count": inc(d.count),
          "sales.netTotalCents": inc(d.net),
          "sales.discountCents": inc(d.disc),
          "sales.feesCents": inc(d.fees),
          "sales.paidTotalCents": inc(d.paid),
          "sales.remainingCents": inc(d.rem),
        },
      });
    } else if (before) {
      const d = salesDelta(before, undefined);
      await updateDailySummaryDelta({
        idTenant,
        idBranch: beforeBranch,
        dateKey: beforeDay,
        updates: {
          "sales.count": inc(d.count),
          "sales.netTotalCents": inc(d.net),
          "sales.discountCents": inc(d.disc),
          "sales.feesCents": inc(d.fees),
          "sales.paidTotalCents": inc(d.paid),
          "sales.remainingCents": inc(d.rem),
        },
      });
    }
  }
);

export const monthlySummaryFromCashMovement = onDocumentWritten(
  {
    document: "tenants/{idTenant}/branches/{idBranch}/cashMovements/{movementId}",
  },
  async (event) => {
    const idTenant = String(event.params.idTenant || "");
    const idBranch = String(event.params.idBranch || "");
    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;
    if (!before && !after) return;

    const beforeMonth = toMonthKey(String(before?.dateKey || ""));
    const afterMonth = toMonthKey(String(after?.dateKey || ""));

    if (before && beforeMonth && beforeMonth !== afterMonth) {
      const d = cashMovementDelta(before, undefined);
      await updateMonthlySummaryDelta({
        idTenant,
        idBranch,
        monthKey: beforeMonth,
        updates: {
          "cashMovements.incomeCents": inc(d.income),
          "cashMovements.expenseCents": inc(d.expense),
        },
      });
    }

    if (after) {
      const d = cashMovementDelta(before, after);
      await updateMonthlySummaryDelta({
        idTenant,
        idBranch,
        monthKey: afterMonth,
        updates: {
          "cashMovements.incomeCents": inc(d.income),
          "cashMovements.expenseCents": inc(d.expense),
        },
      });
    } else if (before && beforeMonth) {
      const d = cashMovementDelta(before, undefined);
      await updateMonthlySummaryDelta({
        idTenant,
        idBranch,
        monthKey: beforeMonth,
        updates: {
          "cashMovements.incomeCents": inc(d.income),
          "cashMovements.expenseCents": inc(d.expense),
        },
      });
    }
  }
);

export const dailySummaryFromCashMovement = onDocumentWritten(
  {
    document: "tenants/{idTenant}/branches/{idBranch}/cashMovements/{movementId}",
  },
  async (event) => {
    const idTenant = String(event.params.idTenant || "");
    const idBranch = String(event.params.idBranch || "");
    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;
    if (!before && !after) return;

    const beforeDay = toDayKey(String(before?.dateKey || ""));
    const afterDay = toDayKey(String(after?.dateKey || ""));

    if (before && beforeDay && beforeDay !== afterDay) {
      const d = cashMovementDelta(before, undefined);
      await updateDailySummaryDelta({
        idTenant,
        idBranch,
        dateKey: beforeDay,
        updates: {
          "cashMovements.incomeCents": inc(d.income),
          "cashMovements.expenseCents": inc(d.expense),
        },
      });
    }

    if (after) {
      const d = cashMovementDelta(before, after);
      await updateDailySummaryDelta({
        idTenant,
        idBranch,
        dateKey: afterDay,
        updates: {
          "cashMovements.incomeCents": inc(d.income),
          "cashMovements.expenseCents": inc(d.expense),
        },
      });
    } else if (before && beforeDay) {
      const d = cashMovementDelta(before, undefined);
      await updateDailySummaryDelta({
        idTenant,
        idBranch,
        dateKey: beforeDay,
        updates: {
          "cashMovements.incomeCents": inc(d.income),
          "cashMovements.expenseCents": inc(d.expense),
        },
      });
    }
  }
);

export const dailySummaryFromAttendance = onDocumentWritten(
  {
    document:
      "tenants/{idTenant}/branches/{idBranch}/classSessions/{sessionId}/" + "attendance/{clientId}",
  },
  async (event) => {
    const idTenant = String(event.params.idTenant || "");
    const idBranch = String(event.params.idBranch || "");
    const sessionId = String(event.params.sessionId || "");
    const clientId = String(event.params.clientId || "");

    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;
    if (!before && !after) return;

    const providedDateKey =
      toDayKey(String(after?.sessionDateKey || "")) ||
      toDayKey(String(before?.sessionDateKey || ""));
    const dateKey =
      providedDateKey ||
      toDayKey(dateKeyFromSessionId(sessionId)) ||
      toDayKey(dateKeyFromTimestamp(after?.markedAt)) ||
      toDayKey(dateKeyFromTimestamp(before?.markedAt));
    if (!dateKey) return;

    const delta = attendanceDelta(before, after);

    const beforePresent = String(before?.status || "") === "present";
    const afterPresent = String(after?.status || "") === "present";
    const beforeHourKey = hourKeyFromAttendance(before);
    const afterHourKey = hourKeyFromAttendance(after);

    const hourUpdates: Record<string, FieldValue> = {};
    if (beforeHourKey && afterHourKey && beforeHourKey === afterHourKey) {
      const hourDelta = (afterPresent ? 1 : 0) - (beforePresent ? 1 : 0);
      if (hourDelta) {
        hourUpdates[`attendance.byHour.${beforeHourKey}`] = inc(hourDelta);
      }
    } else {
      if (beforePresent && beforeHourKey) {
        hourUpdates[`attendance.byHour.${beforeHourKey}`] = inc(-1);
      }
      if (afterPresent && afterHourKey) {
        hourUpdates[`attendance.byHour.${afterHourKey}`] = inc(1);
      }
    }

    if (afterPresent && clientId) {
      const db = admin.firestore();
      const clientRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("clients")
        .doc(clientId);
      await clientRef.set(
        {
          lastPresenceDateKey: dateKey,
          abandonmentRisk: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    if (!delta && Object.keys(hourUpdates).length === 0) return;

    const updates: Record<string, FieldValue> = {
      ...hourUpdates,
    };
    if (delta) {
      updates["attendance.presentCount"] = inc(delta);
    }

    logger.info("dailySummaryFromAttendance", {
      idTenant,
      idBranch,
      dateKey,
      delta,
      beforeStatus: String(before?.status || ""),
      afterStatus: String(after?.status || ""),
      beforeHourKey,
      afterHourKey,
      hourUpdates: Object.keys(hourUpdates),
    });

    await updateDailySummaryDelta({
      idTenant,
      idBranch,
      dateKey,
      updates,
    });
  }
);

export const dailySummaryFromMembership = onDocumentWritten(
  {
    document:
      "tenants/{idTenant}/branches/{idBranch}/clients/{clientId}/" + "memberships/{membershipId}",
  },
  async (event) => {
    const idTenant = String(event.params.idTenant || "");
    const idBranch = String(event.params.idBranch || "");

    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;
    if (!before && !after) return;

    const startKey = (value: admin.firestore.DocumentData | undefined): string =>
      toDayKey(String(value?.startAt || ""));
    const cancelKey = (value: admin.firestore.DocumentData | undefined): string =>
      toDayKey(String(value?.statusDateKey || value?.endAt || ""));

    const beforeStartKey = startKey(before);
    const afterStartKey = startKey(after);
    const beforeIsRenewal = Boolean(before?.previousMembershipId);
    const afterIsRenewal = Boolean(after?.previousMembershipId);

    const deltasByDateKey = new Map<string, Record<string, number>>();

    const queueDelta = (dateKey: string, field: string, delta: number) => {
      if (!dateKey || !delta) return;
      const current = deltasByDateKey.get(dateKey) || {};
      current[field] = (current[field] || 0) + delta;
      deltasByDateKey.set(dateKey, current);
    };

    if (!before && after) {
      const field = afterIsRenewal ? "memberships.renewalCount" : "memberships.newCount";
      queueDelta(afterStartKey, field, 1);
    } else if (before && !after) {
      const field = beforeIsRenewal ? "memberships.renewalCount" : "memberships.newCount";
      queueDelta(beforeStartKey, field, -1);
    } else if (before && after) {
      const beforeField = beforeIsRenewal ? "memberships.renewalCount" : "memberships.newCount";
      const afterField = afterIsRenewal ? "memberships.renewalCount" : "memberships.newCount";
      const shouldMove = beforeStartKey !== afterStartKey || beforeField !== afterField;
      if (shouldMove) {
        queueDelta(beforeStartKey, beforeField, -1);
        queueDelta(afterStartKey, afterField, 1);
      }
    }

    const beforeStatus = String(before?.status || "");
    const afterStatus = String(after?.status || "");
    const beforeCanceled = beforeStatus === "canceled";
    const afterCanceled = afterStatus === "canceled";
    const beforeCancelKey = cancelKey(before);
    const afterCancelKey = cancelKey(after);

    if (beforeCanceled && !afterCanceled) {
      queueDelta(beforeCancelKey, "memberships.cancellationCount", -1);
    } else if (!beforeCanceled && afterCanceled) {
      queueDelta(afterCancelKey, "memberships.cancellationCount", 1);
    } else if (beforeCanceled && afterCanceled && beforeCancelKey !== afterCancelKey) {
      queueDelta(beforeCancelKey, "memberships.cancellationCount", -1);
      queueDelta(afterCancelKey, "memberships.cancellationCount", 1);
    }

    if (!deltasByDateKey.size) return;

    await Promise.all(
      Array.from(deltasByDateKey.entries()).map(([dateKey, deltas]) => {
        const updates = Object.fromEntries(
          Object.entries(deltas).map(([field, delta]) => [field, inc(delta)])
        );
        return updateDailySummaryDelta({
          idTenant,
          idBranch,
          dateKey,
          updates,
        });
      })
    );
  }
);
