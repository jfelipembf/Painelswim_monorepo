const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { processTrigger } = require("./helpers/helper");

/**
 * ============================================================================
 * SCHEDULED AUTOMATIONS
 * ____________________________________________________________________________
 *
 * 1. checkBirthdayAutomations: Função agendada para verificar automações de aniversário.
 *
 * ============================================================================
 */

/**
 * Função agendada para verificar automações de aniversário.
 * Executa todos os dias às 09:00 (Horário de São Paulo).
 */
exports.checkBirthdayAutomations = functions.pubsub
    .schedule("50 21 * * *") // [TEST] Changed to 21:50 for testing
    .timeZone("America/Sao_Paulo")
    .onRun(async (context) => {
        try {
            const automationsSnap = await db.collectionGroup("automations")
                .where("type", "==", "BIRTHDAY")
                .where("active", "==", true)
                .get();

            if (automationsSnap.empty) return null;

            const promises = automationsSnap.docs.map(async (doc) => {
                const automation = doc.data();
                const pathSegments = doc.ref.path.split("/");
                const idTenant = pathSegments[1];
                const idBranch = pathSegments[3];

                const daysBefore = automation.config?.daysBefore || 0;

                // [FIX] Ensure we use Sao_Paulo time for the "Current Date" check
                // Cloud Functions default to UTC. If it's 21:00 BRT, it's 00:00 UTC next day.
                const now = new Date();
                const spDateString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                const spDate = new Date(spDateString);

                const targetDate = new Date(spDate);
                targetDate.setDate(targetDate.getDate() + daysBefore);

                const targetMonth = targetDate.getMonth() + 1;
                const targetDay = targetDate.getDate();

                console.log(`[BirthdayCheck] Checking for date: ${targetDay}/${targetMonth} (DaysBefore: ${daysBefore})`); // [DEBUG]

                const clientsRef = db
                    .collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("clients");

                const clientsSnap = await clientsRef
                    .where("status", "==", "active")
                    .get();

                const matches = [];
                clientsSnap.forEach(clientDoc => {
                    const client = clientDoc.data();
                    if (!client.birthDate || typeof client.birthDate !== "string") return;
                    const parts = client.birthDate.split("-");
                    if (parts.length !== 3) return;
                    const m = Number(parts[1]);
                    const d = Number(parts[2]);

                    if (m === targetMonth && d === targetDay) {
                        matches.push({ id: clientDoc.id, ...client });
                    }
                });

                console.log(`[BirthdayCheck] Found ${matches.length} birthdays.`); // [DEBUG]

                // Process Triggers & Build Cache
                const cacheList = [];

                await Promise.all(matches.map(async (client) => {
                    const data = {
                        name: client.name || "Aluno",
                        professional: "",
                        date: `${String(targetDay).padStart(2, '0')}/${String(targetMonth).padStart(2, '0')}`,
                        time: "",
                        phone: client.phone || client.mobile || client.whatsapp
                    };

                    const sent = await processTrigger(idTenant, idBranch, "BIRTHDAY", data);

                    cacheList.push({
                        id: client.id,
                        name: client.name || "Cliente",
                        photo: client.photo || "",
                        role: "Aluno",
                        date: data.date, // DD/MM match
                        messageSent: sent // Boolean from processTrigger
                    });
                }));

                // Save Cache to Firestore
                if (cacheList.length > 0) {
                    await db.collection("tenants").doc(idTenant)
                        .collection("branches").doc(idBranch)
                        .collection("operationalSummary").doc("birthdays")
                        .set({
                            list: cacheList,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                } else {
                    // Clear cache if no birthdays today (optional, helps avoid showing stale data)
                    // await db.collection("tenants").doc(idTenant)
                    //    .collection("branches").doc(idBranch)
                    //    .collection("operationalSummary").doc("birthdays")
                    //    .delete();
                    // Better to set empty list to clear UI
                    await db.collection("tenants").doc(idTenant)
                        .collection("branches").doc(idBranch)
                        .collection("operationalSummary").doc("birthdays")
                        .set({
                            list: [],
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                }
            });

            await Promise.all(promises);

        } catch (error) {
            console.error("Error in checkBirthdayAutomations:", error);
        }
    });
