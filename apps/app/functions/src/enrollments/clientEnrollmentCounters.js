const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();

const isActive = (status) => {
  const s = String(status || "").toLowerCase();
  return s === "active";
};

const clientRef = ({idTenant, idBranch, idClient}) =>
  db
      .collection("tenants")
      .doc(String(idTenant))
      .collection("branches")
      .doc(String(idBranch))
      .collection("clients")
      .doc(String(idClient));

const applyDelta = async ({idTenant, idBranch, idClient, activeDelta, pastDelta}) => {
  if (!idTenant || !idBranch || !idClient) return;

  const ref = clientRef({idTenant, idBranch, idClient});

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const data = snap.data() || {};
    const nextActive = Math.max(Number(data.enrollmentsActiveCount || 0) + Number(activeDelta || 0), 0);
    const nextPast = Math.max(Number(data.enrollmentsPastCount || 0) + Number(pastDelta || 0), 0);

    tx.set(
        ref,
        {
          enrollmentsActiveCount: nextActive,
          enrollmentsPastCount: nextPast,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {merge: true},
    );
  });
};

const handleCreate = async ({idTenant, idBranch, enrollment}) => {
  const idClient = enrollment?.idClient ? String(enrollment.idClient) : null;
  const active = isActive(enrollment?.status);
  await applyDelta({
    idTenant,
    idBranch,
    idClient,
    activeDelta: active ? 1 : 0,
    pastDelta: active ? 0 : 1,
  });
};

const handleDelete = async ({idTenant, idBranch, enrollment}) => {
  const idClient = enrollment?.idClient ? String(enrollment.idClient) : null;
  const active = isActive(enrollment?.status);
  await applyDelta({
    idTenant,
    idBranch,
    idClient,
    activeDelta: active ? -1 : 0,
    pastDelta: active ? 0 : -1,
  });
};

const handleUpdate = async ({idTenant, idBranch, before, after}) => {
  const beforeClient = before?.idClient ? String(before.idClient) : null;
  const afterClient = after?.idClient ? String(after.idClient) : null;

  const beforeActive = isActive(before?.status);
  const afterActive = isActive(after?.status);

  if (!beforeClient || !afterClient) return;

  if (beforeClient !== afterClient) {
    await applyDelta({
      idTenant,
      idBranch,
      idClient: beforeClient,
      activeDelta: beforeActive ? -1 : 0,
      pastDelta: beforeActive ? 0 : -1,
    });

    await applyDelta({
      idTenant,
      idBranch,
      idClient: afterClient,
      activeDelta: afterActive ? 1 : 0,
      pastDelta: afterActive ? 0 : 1,
    });

    return;
  }

  if (beforeActive === afterActive) return;

  await applyDelta({
    idTenant,
    idBranch,
    idClient: afterClient,
    activeDelta: afterActive ? 1 : -1,
    pastDelta: afterActive ? -1 : 1,
  });
};

module.exports = functions
    .region("us-central1")
    .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
    .onCreate(async (snap, context) => {
      const enrollment = snap.data() || {};
      await handleCreate({
        idTenant: context?.params?.idTenant,
        idBranch: context?.params?.idBranch,
        enrollment,
      });
      return null;
    });

module.exports.onDelete = functions
    .region("us-central1")
    .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
    .onDelete(async (snap, context) => {
      const enrollment = snap.data() || {};
      await handleDelete({
        idTenant: context?.params?.idTenant,
        idBranch: context?.params?.idBranch,
        enrollment,
      });
      return null;
    });

module.exports.onUpdate = functions
    .region("us-central1")
    .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
    .onUpdate(async (change, context) => {
      const before = change.before.data() || {};
      const after = change.after.data() || {};

      await handleUpdate({
        idTenant: context?.params?.idTenant,
        idBranch: context?.params?.idBranch,
        before,
        after,
      });

      return null;
    });
