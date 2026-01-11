const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function agendada para rodar todos os dias às 00:00 (meia-noite).
 * Processa sessões do dia anterior que não tiveram o controle de presença realizado.
 * Marca todos os alunos matriculados como presentes por padrão.
 */
module.exports = functions
  .region("us-central1")
  .pubsub.schedule("0 0 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().split("T")[0];

    try {
      // 1. Buscar todas as sessões de ontem que não têm controle de presença
      // Nota: Como sessões estão dentro de subcoleções de branches, precisamos de um collectionGroup
      // ou iterar por tenants/branches. Para performance, usaremos collectionGroup.
      const sessionsSnap = await db.collectionGroup("sessions")
        .where("sessionDate", "==", yesterdayIso)
        .where("attendanceRecorded", "==", false)
        .get();

      if (sessionsSnap.empty) {
        return null;
      }

      for (const sessionDoc of sessionsSnap.docs) {
        const sessionData = sessionDoc.data();
        const sessionRef = sessionDoc.ref;

        // Extrair IDs do path: tenants/{idTenant}/branches/{idBranch}/sessions/{idSession}
        const pathParts = sessionRef.path.split("/");
        const idTenant = pathParts[1];
        const idBranch = pathParts[3];
        const idSession = pathParts[5];
        const idClass = sessionData.idClass;

        if (!idClass) continue;

        // 2. Buscar matrículas ativas para esta turma
        const enrollmentsSnap = await db.collection("tenants").doc(idTenant)
          .collection("branches").doc(idBranch)
          .collection("enrollments")
          .where("idClass", "==", idClass)
          .where("status", "==", "active")
          .get();

        if (enrollmentsSnap.empty) {
          // Se não há alunos, apenas marca como gravado com 0
          await sessionRef.update({
            attendanceRecorded: true,
            attendanceSnapshot: [],
            presentCount: 0,
            absentCount: 0,
            autoProcessed: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          continue;
        }

        const snapshotData = [];
        const batch = db.batch();

        for (const enrollDoc of enrollmentsSnap.docs) {
          const enrollData = enrollDoc.data();
          const idClient = enrollData.idClient;

          // Buscar dados básicos do cliente
          const clientSnap = await db.collection("tenants").doc(idTenant)
            .collection("branches").doc(idBranch)
            .collection("clients").doc(idClient)
            .get();

          const clientData = clientSnap.exists ? clientSnap.data() : {};

          const clientEntry = {
            idClient: idClient,
            name: clientData.name || `${clientData.firstName || ""} ${clientData.lastName || ""}`.trim() || "Aluno",
            tag: clientData.idGym || "CL",
            photo: clientData.avatar || null,
            status: "present",
            justification: "Presença automática (sistema)",
            enrollmentId: enrollDoc.id,
          };

          snapshotData.push(clientEntry);

          // 3. Salvar na subcoleção do cliente
          const clientAttendanceRef = db.collection("tenants").doc(idTenant)
            .collection("branches").doc(idBranch)
            .collection("clients").doc(idClient)
            .collection("attendance").doc();

          batch.set(clientAttendanceRef, {
            idSession,
            idClass,
            sessionDate: yesterdayIso,
            status: "present",
            justification: "Presença automática (sistema)",
            idTenant,
            idBranch,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // 4. Atualizar o documento da sessão (Snapshot)
        batch.update(sessionRef, {
          attendanceRecorded: true,
          attendanceSnapshot: snapshotData,
          presentCount: snapshotData.length,
          absentCount: 0,
          autoProcessed: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await batch.commit();
      }

    } catch (error) {
      console.error("Erro ao processar auto-presença:", error);
    }

    return null;
  });
