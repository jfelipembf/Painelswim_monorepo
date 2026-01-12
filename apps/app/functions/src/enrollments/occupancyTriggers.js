const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();

const { FieldValue } = require("firebase-admin/firestore");

const isoToday = () => new Date().toISOString().slice(0, 10);

const addDays = (iso, days) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};

const bumpSession = async ({ idTenant, idBranch, idSession, delta }) => {
  if (!idTenant || !idBranch || !idSession) return 0;
  const ref = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions").doc(idSession);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    tx.update(ref, {
      enrolledCount: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return 1;
};

const bumpFutureSessionsByClass = async ({
  idTenant,
  idBranch,
  idClass,
  startIso,
  endIso,
  delta,
}) => {
  if (!idTenant || !idBranch || !idClass || !startIso || !endIso) return 0;

  const sessionsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions");
  const snap = await sessionsCol
    .where("idClass", "==", idClass)
    .where("sessionDate", ">=", startIso)
    .where("sessionDate", "<=", endIso)
    .get();
  if (snap.empty) return 0;

  const batch = db.batch();
  let ops = 0;

  snap.docs.forEach((d) => {
    batch.set(d.ref, {
      enrolledCount: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    ops += 1;
  });

  if (ops > 0) {
    await batch.commit();
  }

  return ops;
};

const normalizeStart = (enrollment, isUpdate = false) => {
  const s = enrollment?.startDate || enrollment?.start || null;
  const today = isoToday();

  // Se for uma atualização (cancelamento), usamos 'today' como início
  // para não afetar sessões passadas.
  if (isUpdate) return today;

  if (!s) return today;
  return String(s) < today ? today : String(s);
};

const normalizeEnd = (enrollment) => {
  const e = enrollment?.endDate || enrollment?.end || null;
  const start = normalizeStart(enrollment);
  const maxWindowEnd = addDays(start, 27); // 4 semanas (28 dias contando o start)
  if (!e) return maxWindowEnd;
  return String(e) > maxWindowEnd ? maxWindowEnd : String(e);
};

const handleEnrollmentBump = async ({ enrollment, delta, isUpdate = false }) => {
  const idTenant = enrollment?.idTenant ? String(enrollment.idTenant) : null;
  const idBranch = enrollment?.idBranch ? String(enrollment.idBranch) : null;
  const type = enrollment?.type || null;

  if (!idTenant || !idBranch) return 0;

  if (type === "experimental") {
    const idSession = enrollment?.idSession ? String(enrollment.idSession) : null;
    const sessionDate = enrollment?.sessionDate ? String(enrollment.sessionDate) : null;
    const startIso = isoToday();
    if (!idSession || !sessionDate || sessionDate < startIso) return 0;
    return bumpSession({ idTenant, idBranch, idSession, delta });
  }

  if (type === "recurring") {
    const idClass = enrollment?.idClass ? String(enrollment.idClass) : null;
    if (!idClass) return 0;

    const startIso = normalizeStart(enrollment, isUpdate);
    const endIso = normalizeEnd(enrollment);

    return bumpFutureSessionsByClass({
      idTenant,
      idBranch,
      idClass,
      startIso,
      endIso,
      delta,
    });
  }

  return 0;
};

module.exports = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onCreate(async (snap) => {
    const enrollment = snap.data() || {};
    const status = (enrollment.status || "").toLowerCase();
    if (status && status !== "active") return null;

    const updated = await handleEnrollmentBump({ enrollment, delta: 1 });
    functions.logger.info("enrollment.onCreate bump", {
      type: enrollment.type,
      idTenant: enrollment.idTenant,
      idBranch: enrollment.idBranch,
      updated,
    });
    return null;
  });

module.exports.onUpdate = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const idEnrollment = context.params.idEnrollment;

    functions.logger.info(`enrollment.onUpdate triggered for ${idEnrollment}`, {
      statusBefore: before.status,
      statusAfter: after.status,
      idClass: after.idClass,
      type: after.type,
    });

    const statusBefore = (before.status || "").toLowerCase();
    const statusAfter = (after.status || "").toLowerCase();

    const activeBefore = statusBefore === "active";
    const activeAfter = statusAfter === "active";

    // Se o status de ativo mudou
    if (activeBefore !== activeAfter) {
      // Se ativou: +1. Se desativou: -1.
      const delta = activeAfter ? 1 : -1;

      functions.logger.info(`enrollment.onUpdate status change detected for ${idEnrollment}`, {
        activeBefore,
        activeAfter,
        delta,
      });

      // Usa o enrollment 'after' para pegar dados atuais.
      // Passamos isUpdate: true para garantir que normalizeStart use 'today'.
      const updated = await handleEnrollmentBump({ enrollment: after, delta, isUpdate: true });

      functions.logger.info("enrollment.onUpdate occupancy bump result", {
        type: after.type,
        idTenant: after.idTenant,
        idBranch: after.idBranch,
        delta,
        updated,
      });
    } else {
      functions.logger.info(`enrollment.onUpdate ignored: status active didn't change for ${idEnrollment}`);
    }

    return null;
  });

module.exports.onDelete = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onDelete(async (snap) => {
    const enrollment = snap.data() || {};
    const status = (enrollment.status || "").toLowerCase();
    if (status && status !== "active") return null;

    const updated = await handleEnrollmentBump({ enrollment, delta: -1 });
    functions.logger.info("enrollment.onDelete bump", {
      type: enrollment.type,
      idTenant: enrollment.idTenant,
      idBranch: enrollment.idBranch,
      updated,
    });
    return null;
  });
