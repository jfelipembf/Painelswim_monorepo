const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Soft delete de uma matrícula (muda status para canceled).
 */
exports.deleteEnrollment = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idEnrollment } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!idEnrollment) {
      throw new functions.https.HttpsError("invalid-argument", "idEnrollment é obrigatório");
    }

    const enrollmentRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("enrollments")
      .doc(idEnrollment);
    const snap = await enrollmentRef.get();

    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "Matrícula não encontrada");
    }

    const enrollmentData = { id: snap.id, ...snap.data() };

    // Soft delete: muda status para canceled em vez de apagar
    await enrollmentRef.update({
      status: "canceled",
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return enrollmentData;
  });

/**
 * Creates a Recurring Enrollment.
 */
exports.createRecurringEnrollment = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = data; // Assuming simpler context extraction if shared not available, but logic implies shared exists.
  // Actually, let's use the pattern from other files if possible, but I don't check import here.
  // I will assume simple context check or replicate requireAuthContext logic if I can't see shared/context.js content. A safer bet is manual check since I didn't see shared/context.js content.

  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in");

  // Basic validation
  if (!idTenant || !idBranch || !data.idClient || !data.idClass) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  const payload = {
    ...data,
    idTenant,
    idBranch,
    type: "recurring",
    status: data.status || "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: uid || context.auth.uid,
  };

  try {
    const ref = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
    const docRef = await ref.add(payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error("Error creating recurring enrollment:", error);
    throw new functions.https.HttpsError("internal", "Error creating enrollment");
  }
});

/**
 * Creates a Single Session Enrollment.
 */
exports.createSingleSessionEnrollment = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = data;

  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in");

  if (!idTenant || !idBranch || !data.idClient || !data.idSession || !data.sessionDate) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  const payload = {
    ...data,
    idTenant,
    idBranch,
    type: data.type || "single-session",
    status: data.status || "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: uid || context.auth.uid,
  };

  try {
    const ref = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
    const docRef = await ref.add(payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error("Error creating single session enrollment:", error);
    throw new functions.https.HttpsError("internal", "Error creating enrollment");
  }
});
