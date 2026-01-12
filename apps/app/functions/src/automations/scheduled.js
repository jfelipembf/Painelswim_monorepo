const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { processTrigger } = require("./automationHelper");

/**
 * Scheduled function to check for birthday automations.
 * Runs every day at 09:00 Sao_Paulo time.
 */
exports.checkBirthdayAutomations = functions.pubsub
    .schedule("0 9 * * *") // Daily at 09:00
    .timeZone("America/Sao_Paulo")
    .onRun(async (context) => {
        console.log("Starting checkBirthdayAutomations...");

        // 1. Get all active BIRTHDAY automations across all tenants/branches
        // Using Collection Group Query requires an index on 'type' and 'active'
        // Index: automations (collectionId) -> fields: type: ASC, active: ASC

        try {
            const automationsSnap = await db.collectionGroup("automations")
                .where("type", "==", "BIRTHDAY")
                .where("active", "==", true)
                .get();

            if (automationsSnap.empty) {
                console.log("No active BIRTHDAY automations found.");
                return null;
            }

            console.log(`Found ${automationsSnap.size} active birthday automations.`);

            const promises = automationsSnap.docs.map(async (doc) => {
                const automation = doc.data();
                // Get parent Branch and Tenant IDs from doc ref path
                // Path: tenants/{idTenant}/branches/{idBranch}/automations/{autoId}
                const pathSegments = doc.ref.path.split("/");
                const idTenant = pathSegments[1];
                const idBranch = pathSegments[3];

                // Determine target birthday date
                // Default: Today. If config.daysBefore is set (e.g. 1), we check for birthdays X days from now? 
                // Usually "Birthday" message is sent ON the day, but support "daysBefore" if needed.
                // If daysBefore > 0, it means we send logic for "Upcoming Birthday".

                const daysBefore = automation.config?.daysBefore || 0;
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + daysBefore);

                const targetMonth = targetDate.getMonth() + 1; // 1-12
                const targetDay = targetDate.getDate(); // 1-31

                console.log(`Checking branch ${idBranch} for birthdays on ${targetDay}/${targetMonth} (DaysBefore: ${daysBefore})`);

                // Query Clients: simpler to query by birthMonth and birthDay if stored separately.
                // If birthDate is YYYY-MM-DD string, we can't easily query range.
                // We'll assume we iterate active clients or use an existing structure.
                // For efficiency, let's fetch 'clients' collection where status == 'active'.

                // IMPORTANT: Querying all clients might be expensive if many. 
                // Ideally, clients should have 'birthMonth' and 'birthDay' fields indexed.
                // IF NOT, we have to fetch all and filter in memory (danger for large bases).
                // Let's assume we filter in memory for now as I don't want to migrate DB.

                const clientsRef = db
                    .collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("clients");

                const clientsSnap = await clientsRef
                    .where("status", "==", "active") // Only active clients?
                    .get();

                const matches = [];

                clientsSnap.forEach(clientDoc => {
                    const client = clientDoc.data();
                    if (!client.birthDate) return;

                    // Parse birthDate (expecting YYYY-MM-DD)
                    const [y, m, d] = client.birthDate.split("-").map(Number);

                    if (m === targetMonth && d === targetDay) {
                        matches.push(client);
                    }
                });

                console.log(`Found ${matches.length} clients having birthday on target date.`);

                // Process Trigger for each match
                const triggerPromises = matches.map(client => {
                    const data = {
                        name: client.name || "Aluno",
                        professional: "", // Not applicable for birthday
                        date: `${targetDay}/${targetMonth}`, // Birthday string
                        time: "",
                        phone: client.phone || client.mobile || client.whatsapp
                    };

                    // We call processTrigger but we need to bypass 'fetching automation' again 
                    // because processTrigger fetches the automation by type. 
                    // To be efficient, processTrigger normally fetches. 
                    // Here we HAD the automation doc, but processTrigger restarts logic.
                    // It's fine for reuse, simply overhead. 
                    // For better efficiency, we could call sendWhatsApp directly, but let's stick to processTrigger for consistency.
                    return processTrigger(idTenant, idBranch, "BIRTHDAY", data);
                });

                return Promise.all(triggerPromises);
            });

            await Promise.all(promises);
            console.log("Finished processing birthday automations.");

        } catch (error) {
            console.error("Error in checkBirthdayAutomations:", error);
        }
    });
