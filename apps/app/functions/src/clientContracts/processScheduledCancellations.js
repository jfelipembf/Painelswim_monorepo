const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { toISODate, toMonthKey } = require("../helpers/date");

/**
 * ============================================================================
 * SCHEDULED CANCELLATIONS PROCESSOR
 * ____________________________________________________________________________
 *
 * 1. processScheduledCancellations: Task agendada que processa cancelamentos 
 *    que foram programados para hoje. Roda diariamente às 00:02 (America/Sao_Paulo),
 *    logo após as suspensões.
 *
 * ============================================================================
 */
module.exports = functions
  .region("us-central1")
  .pubsub.schedule("2 0 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const todayIso = toISODate(new Date());
    const scheduledSnapshot = await db
      .collectionGroup("clientsContracts")
      .where("status", "==", "scheduled_cancellation")
      .where("cancelDate", "<=", todayIso)
      .get();

    let processedCount = 0;

    const processPromises = scheduledSnapshot.docs.map(async (docSnap) => {
      const contract = docSnap.data();
      if (!contract?.cancelDate || contract.cancelDate > todayIso) {
        return;
      }

      const contractRef = docSnap.ref;
      if (!contractRef) return;

      // 1. Remover matrículas futuras (reusando lógica do cancelamento)
      const enrollmentsRef = db
        .collection("tenants")
        .doc(contract.idTenant)
        .collection("branches")
        .doc(contract.idBranch)
        .collection("enrollments");
      const enrollmentsSnap = await enrollmentsRef
        .where("idClient", "==", contract.idClient)
        .get();
      const enrollmentsToRemove = enrollmentsSnap.docs.filter((e) => {
        const data = e.data();
        if (data.type === "recurring") return true;
        if (data.type === "single-session" && data.sessionDate >= todayIso) {
          return true;
        }
        return false;
      });

      const impactedSessionIds = [];
      for (const enrollmentDoc of enrollmentsToRemove) {
        await enrollmentDoc.ref.delete();
        const data = enrollmentDoc.data();
        if (data.idSession) {
          impactedSessionIds.push(data.idSession);
        }
      }

      // 2. Atualizar status do contrato
      await contractRef.update({
        status: "canceled",
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        previousStatus: contract.previousStatus || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2.1 Cancelar dívidas se configurado
      try {
        const settingsRef = db.doc(`tenants/${contract.idTenant}/branches/${contract.idBranch}/settings/general`);
        const settingsSnap = await settingsRef.get();
        const autoCancelDebt = settingsSnap.exists && settingsSnap.data().finance?.cancelDebtOnCancelledContracts === true;

        if (autoCancelDebt && contract.idSale) {
          const receivablesRef = db.collection(`tenants/${contract.idTenant}/branches/${contract.idBranch}/receivables`);
          const debtsSnap = await receivablesRef
            .where("idSale", "==", contract.idSale)
            .where("status", "==", "open")
            .get();

          const debtBatch = db.batch();
          let debtCount = 0;
          debtsSnap.forEach(d => {
            debtBatch.update(d.ref, {
              status: "canceled",
              canceledAt: admin.firestore.FieldValue.serverTimestamp(),
              cancelReason: "Cancelamento programado de contrato",
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            debtCount++;
          });
          if (debtCount > 0) await debtBatch.commit();
        }
      } catch (err) {
        console.error(`Erro ao cancelar dívidas do contrato ${contractRef.id}:`, err);
      }

      // 3. Atualizar summaries (daily/monthly)
      const dailyRef = db
        .collection("tenants")
        .doc(contract.idTenant)
        .collection("branches")
        .doc(contract.idBranch)
        .collection("dailySummary")
        .doc(todayIso);
      const monthId = toMonthKey(todayIso);
      const monthlyRef = db
        .collection("tenants")
        .doc(contract.idTenant)
        .collection("branches")
        .doc(contract.idBranch)
        .collection("monthlySummary")
        .doc(monthId);

      await dailyRef.set({
        idTenant: contract.idTenant,
        idBranch: contract.idBranch,
        id: todayIso,
      }, { merge: true });
      await monthlyRef.set({
        idTenant: contract.idTenant,
        idBranch: contract.idBranch,
        id: monthId,
      }, { merge: true });

      await dailyRef.update({
        contractsCanceledDay: admin.firestore.FieldValue.increment(1),
        churnDay: admin.firestore.FieldValue.increment(1),
        activeCount: admin.firestore.FieldValue.increment(-1), // Decrementa clientes ativos
      });
      await monthlyRef.update({
        contractsCanceledMonth: admin.firestore.FieldValue.increment(1),
        churnMonth: admin.firestore.FieldValue.increment(1),
        activeAvg: admin.firestore.FieldValue.increment(-1), // Decrementa clientes ativos
      });

      processedCount += 1;
    });

    await Promise.all(processPromises);
    functions.logger.info(
      "processScheduledCancellations run",
      { processedCount },
    );
    return null;
  });
