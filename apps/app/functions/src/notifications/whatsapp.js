const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");
const { getIntegrationConfigInternal } = require("../shared/integrations");



if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Sends a WhatsApp message using Evolution API.
 * @param {object} data - { idTenant, idBranch, idClient, message, phoneOverride }
 */
/**
 * Internal function to send WhatsApp message.
 * Can be reused by other Cloud Functions.
 */
const sendWhatsAppMessageInternal = async (idTenant, idBranch, phone, message, integrationId = "evolution") => {
    // 1. Get Integration Config
    const config = await getIntegrationConfigInternal(idTenant, idBranch, integrationId);

    if (!config || !config.baseUrl || !config.apiKey) {
        console.error("Evolution API not configured.");
        throw new functions.https.HttpsError("failed-precondition", "Evolution API is not fully configured.");
    }

    if (!phone) {
        throw new functions.https.HttpsError("invalid-argument", "No phone number provided");
    }

    // Format phone: remove non-numeric chars
    let formattedPhone = phone.replace(/\D/g, "");

    // Brazilian Phone Check: If 10 or 11 digits (e.g., 11999999999 or 1133333333), prepend 55
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
        formattedPhone = "55" + formattedPhone;
    }

    // 2. Send Message via Evolution API
    const instanceName = config.instanceName || "default";

    // Remove trailing slash from baseUrl if present
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/message/sendText/${instanceName}`;

    const payload = {
        number: formattedPhone,
        text: message,
        options: {
            delay: 1200,
            presence: "composing",
        }
    };

    const response = await axios.post(url, payload, {
        headers: {
            apikey: config.apiKey,
            "Content-Type": "application/json",
        }
    });

    return { success: true, data: response.data };
};

exports.sendWhatsAppMessageInternal = sendWhatsAppMessageInternal;

exports.sendWhatsAppMessage = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {



        if (!context.auth) {
            console.warn("User not authenticated.");
            throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
        }

        const { idTenant, idBranch, idClient, message, phoneOverride } = data;

        if (!idTenant || !idBranch || !message) {
            console.error("Missing required fields:", { idTenant, idBranch, message });
            throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
        }

        try {
            let phone = phoneOverride;

            // Fetch Client Phone if not overridden
            if (!phone && idClient) {
                const clientRef = db
                    .collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("clients")
                    .doc(idClient);

                const clientSnap = await clientRef.get();
                if (!clientSnap.exists) {
                    throw new functions.https.HttpsError("not-found", "Client not found");
                }
                const clientData = clientSnap.data();
                phone = clientData.phone || clientData.mobile || clientData.whatsapp;
            }

            if (!phone) {
                throw new functions.https.HttpsError("invalid-argument", "No phone number found for client");
            }

            return await sendWhatsAppMessageInternal(idTenant, idBranch, phone, message);

        } catch (error) {
            console.error("Error sending WhatsApp message:", error.message);

            if (error.response) {
                console.error("Evolution API Error:", error.response.data);
                throw new functions.https.HttpsError("unknown", `Evolution API Error: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                throw new functions.https.HttpsError("unavailable", "Evolution API unreachable.");
            }

            throw new functions.https.HttpsError("internal", error.message);
        }
    });
