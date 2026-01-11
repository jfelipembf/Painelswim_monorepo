const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Helper to update monthly summary
 */
async function updateMonthlySummary(idTenant, idBranch, updates, overrideMonthId = null) {
    if (!idTenant || !idBranch) return;
    const monthId = overrideMonthId || new Date().toISOString().slice(0, 7);
    const monthlyRef = db
        .collection("tenants")
        .doc(String(idTenant))
        .collection("branches")
        .doc(String(idBranch))
        .collection("monthlySummary")
        .doc(monthId);

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updates.idTenant = String(idTenant);
    updates.idBranch = String(idBranch);
    updates.id = monthId;

    await monthlyRef.set(updates, { merge: true });
}

/**
 * 1. Track New Leads
 */
exports.trackNewLead = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}")
    .onWrite(async (change, context) => {
        const idTenant = context?.params?.idTenant;
        const idBranch = context?.params?.idBranch;

        const newData = change.after.exists ? change.after.data() : null;
        const oldData = change.before.exists ? change.before.data() : null;

        if (!newData) return null;

        // Logic 1: Is New Lead?
        const isNewLead = !oldData && (newData.status || "").toLowerCase() === "lead";
        const becameLead = oldData && (oldData.status || "").toLowerCase() !== "lead" && (newData.status || "").toLowerCase() === "lead";

        if (isNewLead || becameLead) {
            // Update Client Funnel State
            const clientRef = change.after.ref;
            const funnel = newData.funnel || {};

            if (!funnel.isLead) {
                await clientRef.update({
                    "funnel.isLead": true,
                    "funnel.leadAt": admin.firestore.FieldValue.serverTimestamp()
                });
                // Increment Metric
                await updateMonthlySummary(idTenant, idBranch, {
                    leadsMonth: admin.firestore.FieldValue.increment(1)
                });
            }
        }
        return null;
    });

/**
 * 2. Track Experimental Scheduled
 */
exports.trackExperimentalScheduled = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
    .onCreate(async (snap, context) => {
        const idTenant = context?.params?.idTenant;
        const idBranch = context?.params?.idBranch;
        const data = snap.data() || {};

        if (data.type === 'experimental' || data.type === 'single-session') {
            const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(data.idClient);

            // Check Client State
            const clientSnap = await clientRef.get();
            if (!clientSnap.exists) return null;
            const funnel = clientSnap.data().funnel || {};

            if (!funnel.scheduled) {
                await clientRef.update({
                    "funnel.scheduled": true,
                    "funnel.scheduledAt": admin.firestore.FieldValue.serverTimestamp()
                });
                await updateMonthlySummary(idTenant, idBranch, {
                    experimental_scheduled: admin.firestore.FieldValue.increment(1)
                });
            }
        }
        return null;
    });

/**
 * 3. Track Conversions
 */
exports.trackConversion = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/clientsContracts/{idContract}")
    .onCreate(async (snap, context) => {
        const idTenant = context?.params?.idTenant;
        const idBranch = context?.params?.idBranch;
        const data = snap.data() || {};

        const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(data.idClient);

        const clientSnap = await clientRef.get();
        if (!clientSnap.exists) return null;
        const funnel = clientSnap.data().funnel || {};

        // Só computa conversão SE o cliente entrou no funil como Lead alguma vez.
        // Isso evita que renovações de alunos antigos (sem histórico de funil atual) contem como conversão.
        if ((funnel.isLead || funnel.leadAt) && !funnel.converted) {
            await clientRef.update({
                "funnel.converted": true,
                "funnel.convertedAt": admin.firestore.FieldValue.serverTimestamp()
            });
            await updateMonthlySummary(idTenant, idBranch, {
                conversions: admin.firestore.FieldValue.increment(1)
            });
        }
        return null;
    });

/**
 * 4. Track Attendance (Experimental)
 */
exports.trackExperimentalAttendance = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}/attendance/{idSession}")
    .onWrite(async (change, context) => {
        const idTenant = context?.params?.idTenant;
        const idBranch = context?.params?.idBranch;
        const idClient = context?.params?.idClient;

        const newData = change.after.exists ? change.after.data() : null;
        if (!newData) return null;

        const isPresent = (newData.status || "").toLowerCase() === 'present';
        const isExperimental = (newData.type || "").toLowerCase() === 'experimental' || (newData.type || "").toLowerCase() === 'single-session';

        if (isPresent && isExperimental) {
            const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient);
            const clientSnap = await clientRef.get();
            if (!clientSnap.exists) return null;
            const funnel = clientSnap.data().funnel || {};

            if (!funnel.attended) {
                await clientRef.update({
                    "funnel.attended": true,
                    "funnel.attendedAt": admin.firestore.FieldValue.serverTimestamp()
                });
                await updateMonthlySummary(idTenant, idBranch, {
                    attended: admin.firestore.FieldValue.increment(1)
                });
            }
        }
        return null;
    });

/**
 * 5. Track Deletion of Experimental Scheduled
 * If user deletes ALL experimental enrollments, revert "Scheduled" status and decrement summary.
 */
exports.trackExperimentalDeletion = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
    .onDelete(async (snap, context) => {
        const idTenant = context?.params?.idTenant;
        const idBranch = context?.params?.idBranch;
        const data = snap.data() || {};

        if (data.type === 'experimental' || data.type === 'single-session') {
            const idClient = data.idClient;
            if (!idClient) return null;

            // Check if client has ANY other experimental enrollments active
            const othersSnap = await db.collection("tenants").doc(idTenant)
                .collection("branches").doc(idBranch)
                .collection("enrollments")
                .where("idClient", "==", idClient)
                .where("type", "in", ["experimental", "single-session"])
                .where("status", "==", "active")
                .limit(1)
                .get();

            if (!othersSnap.empty) {
                // Still has experimental classes, do NOT decrement funnel
                return null;
            }

            // Client has NO experimental classes left. Revert Funnel State.
            const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient);
            const clientSnap = await clientRef.get();
            if (!clientSnap.exists) return null;

            const funnel = clientSnap.data().funnel || {};

            // Only decrement if they were counted as Scheduled
            if (funnel.scheduled) {
                // Determine which month to decrement
                // Use scheduledAt date to find the month
                let monthId = null;
                if (funnel.scheduledAt && funnel.scheduledAt.toDate) {
                    monthId = funnel.scheduledAt.toDate().toISOString().slice(0, 7);
                } else {
                    // Fallback to current month if date is missing (rare)
                    monthId = new Date().toISOString().slice(0, 7);
                }

                await clientRef.update({
                    "funnel.scheduled": false,
                    "funnel.scheduledAt": null
                });

                await updateMonthlySummary(idTenant, idBranch, {
                    experimental_scheduled: admin.firestore.FieldValue.increment(-1)
                }, monthId);
            }
        }
        return null;
    });
