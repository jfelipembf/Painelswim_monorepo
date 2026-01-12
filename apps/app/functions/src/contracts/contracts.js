const functions = require("firebase-functions/v1");
// eslint-disable-next-line no-unused-vars
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");

const { buildContractPayload } = require("../shared/payloads");

const db = admin.firestore();


const getContractsColl = (idTenant, idBranch) =>
  db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("contracts");

/**
 * Creates a new Catalog Contract (Product/Plan).
 */
exports.createContract = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);

  const rawPayload = buildContractPayload(data);

  const payload = {
    ...rawPayload,
    idTenant,
    idBranch,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  };

  // Remove potential ID/auth fields from data if passed maliciously
  delete payload.uid;
  delete payload.token;

  try {
    const ref = getContractsColl(idTenant, idBranch);
    const docRef = await ref.add(payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error("Error creating contract:", error);
    throw new functions.https.HttpsError("internal", "Error creating contract");
  }
});

/**
 * Updates a Catalog Contract.
 */
exports.updateContract = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch } = requireAuthContext(data, context);
  const { idContract, ...updates } = data;

  if (!idContract) {
    throw new functions.https.HttpsError("invalid-argument", "idContract is required");
  }

  const payload = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Prevent updating immutable fields
  delete payload.idTenant;
  delete payload.idBranch;
  delete payload.createdAt;
  delete payload.createdBy;

  try {
    const ref = getContractsColl(idTenant, idBranch).doc(idContract);
    await ref.update(payload);
    return { id: idContract, ...payload };
  } catch (error) {
    console.error("Error updating contract:", error);
    throw new functions.https.HttpsError("internal", "Error updating contract");
  }
});
