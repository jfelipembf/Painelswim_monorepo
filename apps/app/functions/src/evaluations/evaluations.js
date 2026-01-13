const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { processTrigger } = require("../automations/automationHelper");

/**
 * Trigger Automation on Evaluation Write (Create/Update)
 * Listens to: tenants/{idTenant}/branches/{idBranch}/clients/{idClient}/evaluations/{idEvaluation}
 */
exports.onEvaluationWrite = functions
    .region("us-central1")
    .firestore.document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}/evaluations/{idEvaluation}")
    .onWrite(async (change, context) => {
        const { idTenant, idBranch, idClient } = context.params;
        const evaluation = change.after.exists ? change.after.data() : null;

        // If deletion, ignore
        if (!evaluation) return;

        // Only process if it's an "avaliação" event type or generic
        // You might want to filter stronger if needed, but usually ALL saved evaluations should trigger if confirmed.
        // Or check a specific field. For now, we assume any write triggers "EVALUATION_RESULT" if active.

        try {


            // 1. Fetch Client Name
            const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient);
            const clientSnap = await clientRef.get();
            const clientName = clientSnap.exists ? (clientSnap.data().name || "Aluno") : "Aluno";
            const clientPhone = clientSnap.exists ? (clientSnap.data().phone || clientSnap.data().mobile || "") : "";

            const getFirstName = (fullName) => fullName.split(" ")[0];

            // 2. Format Results Summary
            // Structure: 
            // Objective Name
            // - Topic Name: Level Name (Value)
            const levelsMap = evaluation.levelsByTopicId || {};
            const entries = Object.values(levelsMap);

            if (entries.length === 0) {

                return;
            }

            // Sort by objective order then topic order
            entries.sort((a, b) => {
                if ((a.objectiveOrder || 0) !== (b.objectiveOrder || 0)) {
                    return (a.objectiveOrder || 0) - (b.objectiveOrder || 0);
                }
                return (a.topicOrder || 0) - (b.topicOrder || 0);
            });

            // Group by Objective
            const grouped = {};
            entries.forEach(entry => {
                // Filter out "Não avaliado"
                if (!entry.levelName || entry.levelName === "Não avaliado") return;

                const objName = entry.objectiveName || "Geral";
                if (!grouped[objName]) grouped[objName] = [];
                grouped[objName].push(entry);
            });

            let resultsText = "";
            let isFirst = true;

            for (const [objName, topics] of Object.entries(grouped)) {
                if (topics.length === 0) continue;

                if (!isFirst) {
                    resultsText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
                }
                isFirst = false;

                resultsText += `🏊 *${objName}*\n\n`;
                topics.forEach(t => {
                    resultsText += `🔹 ${t.topicName}\n   ⭐ *${t.levelName}*\n\n`;
                });
            }

            // 3. Prepare Data
            const triggerData = {
                name: getFirstName(clientName),
                student: getFirstName(clientName),
                phone: clientPhone,
                date: new Date().toLocaleDateString("pt-BR"), // Or use evaluation.createdAt logic
                results: resultsText.trim()
            };

            // 4. Fire Automation
            // DISABLED: Using explicit trigger in saveEvaluation to ensure reliability and avoid duplicates
            // await processTrigger(idTenant, idBranch, "EVALUATION_RESULT", triggerData);

        } catch (error) {
            console.error("[onEvaluationWrite] Error:", error);
        }
    });

/**
 * Save Evaluation (Create or Update)
 * Callable function to ensure automation triggers work locally and in prod.
 */
exports.saveEvaluation = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
        }

        const { idTenant, idBranch, idClient, idEvaluation, action, payload } = data;

        if (!idTenant || !idBranch || !idClient || !payload) {
            throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
        }

        const evaluationsRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("clients")
            .doc(idClient)
            .collection("evaluations");

        let docRef;
        let finalData = { ...payload };

        try {

            const { FieldValue } = require("firebase-admin/firestore");

            if (action === "update" && idEvaluation) {
                // Update
                docRef = evaluationsRef.doc(idEvaluation);
                finalData.updatedAt = FieldValue.serverTimestamp();
                finalData.updatedByUserId = context.auth.uid;
                await docRef.update(finalData);
            } else {
                // Create
                finalData.createdAt = FieldValue.serverTimestamp();
                finalData.createdBy = context.auth.uid;
                // Add metadata if missing from payload
                finalData.eventTypeName = finalData.eventTypeName || "avaliação";

                docRef = await evaluationsRef.add(finalData);
            }

            // --- AUTOMATION TRIGGER: EVALUATION_RESULT ---
            // Explicitly running trigger logic here since background triggers won't fire
            // when local emulator writes to Prod DB.


            // 1. Fetch Client Name/Phone
            const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient);
            const clientSnap = await clientRef.get();
            const clientName = clientSnap.exists ? (clientSnap.data().name || "Aluno") : "Aluno";
            const clientPhone = clientSnap.exists ? (clientSnap.data().phone || clientSnap.data().mobile || "") : "";

            const getFirstName = (fullName) => fullName.split(" ")[0];

            // 2. Format Results from the PAYLOAD (since we just wrote it)
            // The payload should have levelsByTopicId
            const levelsMap = finalData.levelsByTopicId || {};
            const entries = Object.values(levelsMap);

            if (entries.length > 0) {
                // Sort
                entries.sort((a, b) => {
                    if ((a.objectiveOrder || 0) !== (b.objectiveOrder || 0)) return (a.objectiveOrder || 0) - (b.objectiveOrder || 0);
                    return (a.topicOrder || 0) - (b.topicOrder || 0);
                });

                // 3. Fire Automation
                // Explicitly running trigger logic here since background triggers won't fire
                // when local emulator writes to Prod DB (or if firestore emulator isn't fully synced).

                // Group by Objective
                const grouped = {};
                entries.forEach(entry => {
                    // Filter out "Não avaliado"
                    if (!entry.levelName || entry.levelName === "Não avaliado") return;

                    const objName = entry.objectiveName || "Geral";
                    if (!grouped[objName]) grouped[objName] = [];
                    grouped[objName].push(entry);
                });

                let resultsText = "";
                let isFirst = true;

                for (const [objName, topics] of Object.entries(grouped)) {
                    if (topics.length === 0) continue;

                    if (!isFirst) {
                        resultsText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
                    }
                    isFirst = false;

                    resultsText += `🏊 *${objName}*\n\n`;
                    topics.forEach(t => {
                        resultsText += `🔹 ${t.topicName}\n   ⭐ *${t.levelName}*\n\n`;
                    });
                }

                if (resultsText) {
                    const triggerData = {
                        name: getFirstName(clientName),
                        student: getFirstName(clientName),
                        phone: clientPhone,
                        date: new Date().toLocaleDateString("pt-BR"),
                        results: resultsText.trim()
                    };

                    await processTrigger(idTenant, idBranch, "EVALUATION_RESULT", triggerData);
                }
            }
            // --------------------------------------------------

            return { id: docRef.id, ...finalData };

        } catch (error) {
            console.error("Error saving evaluation:", error);
            throw new functions.https.HttpsError("internal", "Error saving evaluation");
        }
    });
