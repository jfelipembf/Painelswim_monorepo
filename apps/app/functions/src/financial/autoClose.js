const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// ============================================================================
// SCHEDULED TASKS (Tarefas Agendadas)
// ============================================================================

/**
 * Fecha automaticamente os caixas abertos.
 * Frequência: Diariamente às 23:59 (Brasília).
 * Lógica: Verifica configurações de cada unidade e fecha caixas abertos se `finance.autoCloseCashier` for true.
 */
const runAutoClose = async (db) => {
  try {
    // 1. Listar todos os tenants
    const tenantsSnap = await db.collection("tenants").get();

    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;

      // 2. Listar branches do tenant
      const branchesSnap = await db.collection(`tenants/${tenantId}/branches`).get();

      for (const branchDoc of branchesSnap.docs) {
        const branchId = branchDoc.id;

        // 3. Ler configurações da unidade
        const settingsRef = db.doc(`tenants/${tenantId}/branches/${branchId}/settings/general`);
        const settingsSnap = await settingsRef.get();

        if (!settingsSnap.exists) continue;

        const settings = settingsSnap.data();
        const autoClose = settings.finance?.autoCloseCashier === true;

        if (!autoClose) continue;

        // 4. Buscar caixas abertos
        const cashierRef = db.collection(`tenants/${tenantId}/branches/${branchId}/cashierSessions`);
        const openSessionsSnap = await cashierRef.where("status", "==", "open").get();

        if (openSessionsSnap.empty) continue;

        const batch = db.batch();
        const now = admin.firestore.FieldValue.serverTimestamp();

        openSessionsSnap.docs.forEach((doc) => {
          const data = doc.data();
          batch.update(doc.ref, {
            status: "closed",
            closedAt: now,
            autoClosed: true,
            closingBalance: data.currentBalance || data.openingBalance || 0, // Assume saldo atual ou inicial
            updatedAt: now,
          });
        });

        await batch.commit();
      }
    }
  } catch (error) {
    console.error("Erro no fechamento automático de caixas:", error);
  }
};


/**
 * Fecha automaticamente os caixas abertos se a configuração permitir.
 * Executa todo dia às 23:59.
 */
exports.autoCloseCashier = functions
  .region("us-central1")
  .pubsub.schedule("59 23 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    const db = admin.firestore();
    await runAutoClose(db);
    return null;
  });


