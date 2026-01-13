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


    try {
        const automationsRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("automations");

        // Query active automations for this trigger type

        const snapshot = await automationsRef
            .where("active", "==", true)
            .where("type", "==", triggerType)
            .get();

        if (snapshot.empty) {

            return;
        }


        // SINGLETON ENFORCEMENT:
        // The UI only allows configuring ONE automation per type.
        // If duplicates exist in DB, we should only process the first one to avoid double sending.
        const automationDoc = snapshot.docs[0];
        const automation = automationDoc.data();
        let message = automation.whatsappTemplate;

        // Replace Variables
        // Supported: {name}, {date}, {time}, {professional}, {activity}
        if (message) {
            message = message.replace(/{name}/g, data.name || "");
            message = message.replace(/{date}/g, data.date || "");
            message = message.replace(/{time}/g, data.time || "");
            message = message.replace(/{professional}/g, data.professional || "");
            message = message.replace(/{activity}/g, data.activity || "");
            message = message.replace(/{student}/g, data.student || data.name || "");
            message = message.replace(/{teacher}/g, data.teacher || data.professional || "");
            message = message.replace(/{results}/g, data.results || "");

            // You can add more variables here as needed
        }



        if (data.phone && message) {
            await sendWhatsAppMessageInternal(idTenant, idBranch, data.phone, message);
        }



    } catch (error) {
        console.error(`Error processing trigger ${triggerType}:`, error);
    }
};
