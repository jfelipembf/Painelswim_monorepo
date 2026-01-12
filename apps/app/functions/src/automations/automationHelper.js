const admin = require("firebase-admin");
const db = admin.firestore();
const { sendWhatsAppMessageInternal } = require("../notifications/whatsapp");

/**
 * Process an Automation Trigger
 * @param {string} idTenant 
 * @param {string} idBranch 
 * @param {string} triggerType - One of NEW_LEAD, EXPERIMENTAL_SCHEDULED, etc.
 * @param {object} data - Data to replace variables (name, date, time, etc.)
 */
exports.processTrigger = async (idTenant, idBranch, triggerType, data) => {
    console.log(`Processing Trigger: ${triggerType} for branch ${idBranch}`);

    try {
        const automationsRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("automations");

        // Query active automations for this trigger type
        console.log(`[DEBUG] processTrigger querying: active=true, type=${triggerType}`);
        const snapshot = await automationsRef
            .where("active", "==", true)
            .where("type", "==", triggerType)
            .get();

        if (snapshot.empty) {
            console.log(`[DEBUG] No active automations found for ${triggerType}`);
            return;
        }
        console.log(`[DEBUG] Found ${snapshot.size} active automations for ${triggerType}`);

        const promises = snapshot.docs.map(async (doc) => {
            const automation = doc.data();
            let message = automation.whatsappTemplate;

            // Replace Variables
            // Supported: {name}, {date}, {time}, {professional}, {activity}
            if (message) {
                message = message.replace(/{name}/g, data.name || "");
                message = message.replace(/{date}/g, data.date || "");
                message = message.replace(/{time}/g, data.time || "");
                message = message.replace(/{professional}/g, data.professional || "");
                message = message.replace(/{activity}/g, data.activity || "");

                // You can add more variables here as needed
            }

            console.log(`Triggering Automation: ${automation.name} -> Sending to ${data.phone}`);

            // Send Message (using Internal helper to avoid HTTP call overhead if possible, 
            // but we might need to use the one that constructs axios)
            // Ideally we should reuse the logic from sendWhatsAppMessage but as a persistent function 
            // or just call the function if it's modular.
            // For now, let's assume we can import the logic or call the internal helper if refactored.
            // Since sendWhatsAppMessage is an HTTPS callable, we need the logic extracted.

            // Checking if `sendWhatsAppMessageInternal` exists or if we need to expose it.
            // If not, we fall back to just logging for now until we expose the logic.

            if (data.phone && message) {
                return sendWhatsAppMessageInternal(idTenant, idBranch, data.phone, message);
            }
        });

        await Promise.all(promises);
        console.log(`Processed ${snapshot.size} automations for ${triggerType}`);

    } catch (error) {
        console.error(`Error processing trigger ${triggerType}:`, error);
    }
};
