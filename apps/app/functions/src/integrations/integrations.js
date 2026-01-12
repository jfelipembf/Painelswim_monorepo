const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const axios = require("axios");

/**
 * Salva a configuração de uma integração e gerencia recursos externos (Evolution API).
 * @param {object} data - Dados da requisição { idTenant, idBranch, integrationId, config }
 * @param {object} context - Contexto da autenticação
 */
exports.saveIntegrationConfig = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário deve estar autenticado."
      );
    }

    const { idTenant, idBranch, integrationId, config } = data;

    if (!idTenant || !idBranch || !integrationId || !config) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Tenant, Branch, ID da integração e configuração são obrigatórios."
      );
    }

    try {
      // --- Evolution API Specific Logic ---
      if (integrationId === 'evolution' && config.baseUrl && config.apiKey && config.instanceName) {
        const baseUrl = config.baseUrl.replace(/\/$/, "");

        // Try to create instance. If fails, log but continue saving config.
        const createUrl = `${baseUrl}/instance/create`;
        const createPayload = {
          instanceName: config.instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        };

        try {
          await axios.post(createUrl, createPayload, {
            headers: {
              apikey: config.apiKey,
              "Content-Type": "application/json"
            }
          });
        } catch (apiError) {
          // Log warning if creation fails (e.g. already exists) but don't block
          console.warn("Evolution API Instance creation/verification warning:",
            apiError.response ? apiError.response.data : apiError.message);
        }
      }
      // ------------------------------------

      // Salva na subcoleção do branch
      const targetRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("integrations")
        .doc(integrationId);

      const payload = {
        ...config,
        updatedAt: new Date(), // Replacing serverTimestamp to avoid version compatibility issues
        updatedBy: context.auth.uid
      };

      await targetRef.set(payload, { merge: true });

      return { success: true, message: "Configuração salva com sucesso." };
    } catch (error) {
      console.error("Erro ao salvar configuração de integração:", error);
      throw new functions.https.HttpsError("internal", "Erro ao salvar configuração: " + error.message);
    }
  });

/**
 * Recupera a configuração de uma integração.
 * @param {object} data - Dados da requisição { idTenant, idBranch, integrationId }
 * @param {object} context - Contexto da autenticação
 */
exports.getIntegrationConfig = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário deve estar autenticado."
      );
    }

    const { idTenant, idBranch, integrationId } = data;

    if (!idTenant || !idBranch || !integrationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Tenant, Branch e ID da integração são obrigatórios."
      );
    }

    try {
      const targetRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("integrations")
        .doc(integrationId);

      const doc = await targetRef.get();

      if (!doc.exists) {
        return { config: {} };
      }

      return { config: doc.data() };
    } catch (error) {
      console.error("Erro ao recuperar configuração:", error);
      throw new functions.https.HttpsError("internal", "Erro ao recuperar configuração.");
    }
  });
