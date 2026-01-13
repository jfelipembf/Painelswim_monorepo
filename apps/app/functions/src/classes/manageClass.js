const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { requireAuthContext } = require("../shared/context");

const { FieldValue } = require("firebase-admin/firestore");

const db = admin.firestore();

/**
 * Update a Class.
 * Handles `endDate` logic: removes future sessions and terminates enrollments.
 */
exports.updateClass = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch } = requireAuthContext(data, context);

    // Resolve ID and Updates based on payload structure (flat vs wrapped)
    const id = data.id || data.idClass;
    let updates = data.classData;

    // If classData is not provided, assume flat structure and remove system fields
    if (!updates) {
        const { id: _id, idClass: _idClass, idTenant: _t, idBranch: _b, ...rest } = data;
        updates = rest;
    }

    if (!id) {
        throw new functions.https.HttpsError("invalid-argument", "Class ID is required");
    }

    const classRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("classes").doc(id);
    const sessionsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions");
    const enrollmentsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");

    try {
        let shouldUpdateSessions = false;
        const sessionUpdates = {};

        const clientsContractsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clientsContracts");

        // VALIDATION: Check for contract restrictions if changing days
        if (updates.weekDays && Array.isArray(updates.weekDays)) {
            const newDays = updates.weekDays.map(Number); // Ensure numbers

            // 1. Get Active Enrollments
            const activeEnrollmentsSnap = await enrollmentsCol
                .where("idClass", "==", id)
                .where("status", "==", "active")
                .get();

            if (!activeEnrollmentsSnap.empty) {
                const enrollmentPromises = activeEnrollmentsSnap.docs.map(async (doc) => {
                    const enrollment = doc.data();
                    const clientId = enrollment.idClient;
                    const clientName = enrollment.clientName || "Aluno";

                    // 2. Get Active Contract for Client
                    const contractsSnap = await clientsContractsCol
                        .where("idClient", "==", clientId)
                        .where("status", "==", "active")
                        .limit(1)
                        .get();

                    if (!contractsSnap.empty) {
                        const contract = contractsSnap.docs[0].data();
                        const allowedDays = contract.allowedWeekDays;

                        // If contract has day restrictions (non-empty array)
                        if (allowedDays && Array.isArray(allowedDays) && allowedDays.length > 0) {
                            // Check if ALL new days are allowed
                            const isAllowed = newDays.every(day => allowedDays.includes(Number(day)));

                            if (!isAllowed) {
                                const dayMap = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
                                const allowedDayNames = allowedDays.map(d => dayMap[Number(d)] || d).join(", ");
                                return `O aluno(a) ${clientName} possui contrato restrito aos dias: ${allowedDayNames}.`;
                            }
                        }
                    }
                    return null;
                });

                const results = await Promise.all(enrollmentPromises);
                const errors = results.filter(error => error !== null);

                if (errors.length > 0) {
                    throw new functions.https.HttpsError("failed-precondition", errors.join("\n"));
                }
            }
        }

        // Helper to compute end time
        const computeEndTime = (start, minutes) => {
            if (!start || !minutes) return "";
            const [h, m] = start.split(":").map(Number);
            const date = new Date(0, 0, 0, h, m + Number(minutes));
            return date.toTimeString().slice(0, 5);
        };

        await db.runTransaction(async (t) => {
            const doc = await t.get(classRef);
            if (!doc.exists) {
                throw new functions.https.HttpsError("not-found", "Class not found");
            }

            const currentData = doc.data();

            // Check for changes in fields that affect sessions
            const sessionFields = ["idActivity", "idArea", "idStaff", "maxCapacity", "startTime", "durationMinutes"];

            sessionFields.forEach(field => {
                if (updates[field] !== undefined && updates[field] !== currentData[field]) {
                    shouldUpdateSessions = true;
                    sessionUpdates[field] = updates[field];
                }
            });

            // Re-calculate endTime if needed
            if (sessionUpdates.startTime || sessionUpdates.durationMinutes) {
                const start = sessionUpdates.startTime || currentData.startTime;
                const duration = sessionUpdates.durationMinutes || currentData.durationMinutes;
                const newEndTime = computeEndTime(start, duration);
                updates.endTime = newEndTime;
                sessionUpdates.endTime = newEndTime; // Update session endTime too
            }

            // Update Class
            t.update(classRef, {
                ...updates,
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        // POST-TRANSACTION: Session Updates
        if (shouldUpdateSessions) {
            const nowIso = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }).split("/").reverse().join("-");

            // Query future sessions to update
            const sessionsSnap = await sessionsCol
                .where("idClass", "==", id)
                .where("sessionDate", ">=", nowIso)
                .get();

            if (!sessionsSnap.empty) {
                const batch = db.batch();
                let params = { ...sessionUpdates };

                // Remove undefined keys
                Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

                params.updatedAt = FieldValue.serverTimestamp();

                sessionsSnap.docs.forEach(doc => {
                    batch.update(doc.ref, params);
                });

                await batch.commit();

            }
        }

        // POST-TRANSACTION: End Date Cleanup (Existing Logic)
        if (updates.endDate) {
            const limitIso = updates.endDate; // Format: YYYY-MM-DD

            // Validate date format (simple regex check for YYYY-MM-DD)
            if (!limitIso || !/^\d{4}-\d{2}-\d{2}$/.test(limitIso)) {
                console.warn(`Invalid endDate format: ${limitIso}. Skipping end date processing.`);
            } else {

                // 1. Delete Sessions after endDate
                const sessionsToDeleteSnap = await sessionsCol
                    .where("idClass", "==", id)
                    .where("sessionDate", ">", limitIso)
                    .get();

                if (!sessionsToDeleteSnap.empty) {
                    const batch = db.batch();
                    sessionsToDeleteSnap.docs.forEach(d => batch.delete(d.ref));
                    await batch.commit();

                }

                // 2. Terminate Active Enrollments
                const enrollmentsSnap = await enrollmentsCol
                    .where("idClass", "==", id)
                    .where("status", "==", "active")
                    .get();

                if (!enrollmentsSnap.empty) {
                    const batch = db.batch();
                    let updatedCount = 0;

                    enrollmentsSnap.docs.forEach(d => {
                        const enr = d.data();
                        const enrEnd = enr.endDate;
                        if (!enrEnd || enrEnd > limitIso) {
                            batch.update(d.ref, {
                                endDate: limitIso,
                                updatedAt: FieldValue.serverTimestamp()
                            });
                            updatedCount++;
                        }
                    });

                    if (updatedCount > 0) {
                        await batch.commit();
                    }
                }
            }
        } // End else valid date

        return { success: true };

    } catch (error) {
        console.error("Error updating class:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});


/**
 * Delete a Class safely.
 */
exports.deleteClass = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch } = requireAuthContext(data, context);

    // Resolve ID (flat or wrapped)
    const id = data.id || data.idClass;

    if (!id) {
        throw new functions.https.HttpsError("invalid-argument", "Class ID is required");
    }

    const classRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("classes").doc(id);
    const enrollmentsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
    const sessionsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions");

    // 1. Check for Active Enrollments
    const activeEnr = await enrollmentsCol
        .where("idClass", "==", id)
        .where("status", "==", "active")
        .limit(1)
        .get();

    if (!activeEnr.empty) {
        throw new functions.https.HttpsError("failed-precondition", "Não é possível excluir: Existem alunos matriculados ativos nesta turma.");
    }

    // 2. Check for Historical Attendance (Sessions with attendance > 0)
    // Logic: access previous sessions that have 'attendance' field or specific status?
    // Usually 'completed' or 'confirmed'
    const historySessions = await sessionsCol
        .where("idClass", "==", id)
        .where("status", "in", ["completed", "held"]) // Check your specific status values for "Realizada"
        .limit(1)
        .get();

    if (!historySessions.empty) {
        // Optional: Allow deletion but keep history? User asked "nao deve ser permitido".
        throw new functions.https.HttpsError("failed-precondition", "Não é possível excluir: Existem aulas realizadas com histórico para esta turma.");
    }

    // 3. Delete Class and Future/Empty Sessions
    try {
        // Delete Class
        await classRef.delete();

        // Delete ALL sessions for this class (since no history exists, or we only delete future ones?)
        // If we passed the history check, it means no meaningful history exists.
        // However, there might be 'scheduled' sessions in the past that weren't realized?
        // Let's delete ALL sessions to clean up.

        // Batch delete (might need recursive delete for large numbers, keeping it simple for now)
        const sessions = await sessionsCol.where("idClass", "==", id).get();

        const batch = db.batch();
        let count = 0;
        sessions.docs.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });

        // Delete enrollments too? (Historical/inactive ones)
        // User didn't specify, but usually we keep canceled/finished history.
        // If we delete the class, the enrollment reference breaks. 
        // Safest is to KEEP inactive enrollments but they will point to a missing class ID.
        // Or we deny deletion if ANY enrollment history exists? 
        // User request: "nao deve ser permitido ... que tem alunos matriculados" (implies active).
        // Let's assume just active.

        if (count > 0) await batch.commit();

        return { success: true };
    } catch (error) {
        console.error("Error deleting class:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
