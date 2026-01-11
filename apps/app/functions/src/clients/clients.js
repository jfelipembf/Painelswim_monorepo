const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { buildClientPayload } = require("../shared/payloads");

/**
 * Gera um idGym sequencial (0001, 0002...) por UNIDADE (branch).
 * Armazena em: tenants/{t}/branches/{b}/counters/clients
 */
exports.getNextClientGymId = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    const db = admin.firestore();
    const counterRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("counters")
      .doc("clients");

    const next = await db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists ? Number(snap.data()?.value || 0) : 0;
      const value = current + 1;
      tx.set(counterRef, { value }, { merge: true });
      return value;
    });

    return String(next).padStart(4, "0");
  });

/**
 * Cria um cliente.
 */
exports.createClient = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    try {
      console.log("createClient started", JSON.stringify(data));
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
      }

      const { idTenant, idBranch, clientData } = data;

      if (!idTenant || !idBranch) {
        throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
      }

      if (!clientData) {
        throw new functions.https.HttpsError("invalid-argument", "clientData é obrigatório");
      }

      const db = admin.firestore();

      // Gerar idGym sequencial
      const counterRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("counters")
        .doc("clients");

      const idGym = await db.runTransaction(async (tx) => {
        const snap = await tx.get(counterRef);
        const current = snap.exists ? Number(snap.data()?.value || 0) : 0;
        const value = current + 1;
        tx.set(counterRef, { value }, { merge: true });
        return String(value).padStart(4, "0");
      });

      const clientRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("clients")
        .doc();

      // Use shared builder for consistency
      const basePayload = buildClientPayload(clientData);

      const rawPayload = {
        ...basePayload,
        idGym,
        idTenant,
        idBranch,
        // Ensure backend timestamps
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Strip undefined values including nested ones using JSON serialization
      const payload = JSON.parse(JSON.stringify(rawPayload));
      console.log("createClient payload ready:", JSON.stringify(payload));

      await clientRef.set(payload);

      return { id: clientRef.id, ...payload };
    } catch (error) {
      console.error("Error creating client:", error);
      throw new functions.https.HttpsError("internal", error.message || "Erro interno ao criar cliente");
    }
  });

/**
 * Atualiza um cliente.
 */
exports.updateClient = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
      }

      const { idTenant, idBranch, idClient, clientData } = data;

      if (!idTenant || !idBranch) {
        throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
      }

      if (!idClient) {
        throw new functions.https.HttpsError("invalid-argument", "idClient é obrigatório");
      }

      if (!clientData) {
        throw new functions.https.HttpsError("invalid-argument", "clientData é obrigatório");
      }

      const db = admin.firestore();

      const clientRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("clients")
        .doc(idClient);

      // Lógica para manter o nome completo sincronizado
      let derivedName = clientData.name;
      const { firstName, lastName } = clientData;

      if (firstName !== undefined && lastName !== undefined) {
        derivedName = [firstName, lastName].filter(Boolean).join(" ").trim();
      }

      const rawPayload = {
        ...clientData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (derivedName !== undefined) {
        rawPayload.name = derivedName;
      }

      // Strip undefined values
      const payload = JSON.parse(JSON.stringify(rawPayload));
      console.log("updateClient payload ready:", JSON.stringify(payload));

      await clientRef.update(payload);

      return { id: idClient, ...payload };
    } catch (error) {
      console.error("Error updating client:", error);
      throw new functions.https.HttpsError("internal", error.message || "Erro interno ao atualizar cliente");
    }
  });
