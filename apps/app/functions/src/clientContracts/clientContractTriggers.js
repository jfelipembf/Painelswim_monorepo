const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;


/**
 * Helper para verificar se um status conta como 'ativo' para fins de média.
 */
const isActiveLike = (status) => {
  return ["active", "pending_setup", "expiring"].includes(status);
};


/**
 * Atualiza os contadores em dailySummary e monthlySummary para Contratos
 */
const updateContractSummaries = async ({ idTenant, idBranch, dateStr, updates, monthlyUpdates }) => {
  if (!idTenant || !idBranch || !dateStr) return;
  if (Object.keys(updates).length === 0 && Object.keys(monthlyUpdates).length === 0) return;

  const monthId = dateStr.slice(0, 7); // YYYY-MM

  const dailyRef = db
    .collection("tenants").doc(idTenant)
    .collection("branches").doc(idBranch)
    .collection("dailySummary").doc(dateStr);

  const monthlyRef = db
    .collection("tenants").doc(idTenant)
    .collection("branches").doc(idBranch)
    .collection("monthlySummary").doc(monthId);

  const batch = db.batch();

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = FieldValue.serverTimestamp();
    batch.set(dailyRef, updates, { merge: true });
  }

  if (Object.keys(monthlyUpdates).length > 0) {
    monthlyUpdates.updatedAt = FieldValue.serverTimestamp();
    batch.set(monthlyRef, monthlyUpdates, { merge: true });
  }

  await batch.commit();
};

exports.onClientContractWrite = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/clientsContracts/{idContract}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch } = context.params;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const dateStr = after ?
      (after.startDate || new Date().toISOString().slice(0, 10)) :
      (before.startDate || new Date().toISOString().slice(0, 10));

    // Usar data de "hoje" para eventos de fluxo (churn, cancelamento, etc)
    // ou data do contrato?
    // O código original usava "getToday()" para eventos de fluxo, e data do contrato para contagem de ativos?
    // Vamos usar a data atual do processamento para eventos de mudança de status.
    const todayStr = new Date().toISOString().slice(0, 10);

    const updates = {};
    const monthlyUpdates = {};

    // Helper to increment both
    const inc = (field, val = 1) => {
      updates[field] = FieldValue.increment(val);
      monthlyUpdates[field === "activeCount" ? "activeAvg" : field] = FieldValue.increment(val); // activeCount map to activeAvg in monthly as per original logic?
      // Original logic: daily.activeCount, monthly.activeAvg.
      // Flow counters: same name.
    };

    // Helper specific mappings
    const incFlow = (field) => {
      // Flow metrics use TODAY's date
      // But updateContractSummaries uses `dateStr` derived above.
      // We might need separate calls if dates differ.
      // For simplicity, let's assume we update the "current" summary for flows.
      // But wait, if I edit an old contract, `dateStr` might be old.
      // Flow metrics (cancel today) should go to TODAY's summary.
      // State metrics (active count) usually reflect current state, often snapshot or managed by increment/decrement on the "current" summary?
      // In the original code `summaryOnClientContractCreate`, `applySummaryCounters` uses the date?
      // Actually `applySummaryCounters` in frontend usually defaulted to today unless specified.
      // Let's use `todayStr` for everything as these are time-series metrics.
    };

    // We will use `todayStr` for all updates to simplify. Dashboard usually shows "Active Users Today".

    // 1. Create
    if (!before && after) {
      updates.newCount = FieldValue.increment(1);
      monthlyUpdates.newCount = FieldValue.increment(1);

      if (isActiveLike(after.status)) {
        updates.activeCount = FieldValue.increment(1);
        monthlyUpdates.activeAvg = FieldValue.increment(1);
      }
    }

    // 2. Delete
    if (before && !after) {
      if (isActiveLike(before.status)) {
        updates.activeCount = FieldValue.increment(-1);
        monthlyUpdates.activeAvg = FieldValue.increment(-1);
      }
    }

    // 3. Update
    if (before && after) {
      const statusBefore = before.status;
      const statusAfter = after.status;

      // Active Count transitions
      const wasActive = isActiveLike(statusBefore);
      const isActive = isActiveLike(statusAfter);

      if (!wasActive && isActive) {
        updates.activeCount = FieldValue.increment(1);
        monthlyUpdates.activeAvg = FieldValue.increment(1);
      } else if (wasActive && !isActive) {
        updates.activeCount = FieldValue.increment(-1);
        monthlyUpdates.activeAvg = FieldValue.increment(-1);
      }

      // Flow metrics (transitions)

      // Cancelled
      if (statusBefore !== "canceled" && statusAfter === "canceled") {
        updates.contractsCanceledDay = FieldValue.increment(1);
        updates.churnDay = FieldValue.increment(1);
        monthlyUpdates.contractsCanceledMonth = FieldValue.increment(1);
        monthlyUpdates.churnMonth = FieldValue.increment(1);
      }

      // Scheduled Cancellation
      if (statusBefore !== "scheduled_cancellation" && statusAfter === "scheduled_cancellation") {
        updates.contractsScheduledCancellationDay = FieldValue.increment(1);
        monthlyUpdates.contractsScheduledCancellationMonth = FieldValue.increment(1);
      }

      // Suspended (Stock - Currently Suspended)
      if (statusBefore !== "suspended" && statusAfter === "suspended") {
        updates.suspendedCount = FieldValue.increment(1);
        // For monthly flow, we might want to keep tracking just new ones, but usually dashboard cards share the generic count.
        // Let's make suspendedCount represent "Current Suspended" for daily logic to match Active.
        monthlyUpdates.suspendedCount = FieldValue.increment(1);
      } else if (statusBefore === "suspended" && statusAfter !== "suspended") {
        updates.suspendedCount = FieldValue.increment(-1);
        // If we treat monthly as stock average or total, we might decrement. 
        // If monthly is "Total Suspensions this month", we shouldn't decrement. 
        // However, usually monthly summary stores snapshots or flows. 
        // Given 'activeCount/activeAvg' behavior, let's align.
        monthlyUpdates.suspendedCount = FieldValue.increment(-1);
      }

      // Refunded (Field check)
      if (!before.refunded && after.refunded) {
        updates.refundsDay = FieldValue.increment(1);
        monthlyUpdates.refundsMonth = FieldValue.increment(1);
      }
    }

    await updateContractSummaries({
      idTenant,
      idBranch,
      dateStr: todayStr,
      updates,
      monthlyUpdates,
    });
  });
