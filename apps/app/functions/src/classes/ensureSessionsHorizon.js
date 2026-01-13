const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { toISODate } = require("./helpers/dateUtils");
const { generateSessionsForClass } = require("./helpers/sessionGenerator");

/**
 * ============================================================================
 * SESSÕES (SCHEDULED)
 * ____________________________________________________________________________
 *
 * 1. ensureSessionsHorizon: Garante sessões criadas para o horizonte (6 meses).
 *
 * ============================================================================
 */

// (duplicate helpers removed)

/**
 * Garante que existam sessões criadas para os próximos 6 meses.
 * Roda diariamente para manter o horizonte sempre preenchido.
 */
module.exports = functions
  .region("us-central1")
  .pubsub.schedule("10 0 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    const fromIso = toISODate(new Date());
    const weeks = 26; // ~6 meses

    const tenantsSnap = await db.collection("tenants").get();

    let createdTotal = 0;

    for (const tenantDoc of tenantsSnap.docs) {
      const idTenant = tenantDoc.id;
      const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

      for (const branchDoc of branchesSnap.docs) {
        const idBranch = branchDoc.id;
        const classesSnap = await db
          .collection("tenants")
          .doc(idTenant)
          .collection("branches")
          .doc(idBranch)
          .collection("classes")
          .get();

        for (const classDoc of classesSnap.docs) {
          const classData = classDoc.data() || {};
          const res = await generateSessionsForClass({
            idTenant,
            idBranch,
            idClass: classDoc.id,
            classData,
            weeks,
            fromDate: fromIso,
          });
          createdTotal += res.created;
        }
      }
    }

    functions.logger.info("ensureSessionsHorizon", { fromIso, weeks, createdTotal });
    return null;
  });

