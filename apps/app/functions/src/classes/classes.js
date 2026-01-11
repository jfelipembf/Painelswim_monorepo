const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore();

/**
 * Gera sessões (documents) para uma turma (class) nas próximas N semanas.
 * - sessions são ocorrências datadas (sessionDate)
 * - idSession é determinístico: `${idClass}-${YYYY-MM-DD}`
 *
 * IMPORTANTE:
 * - Para não sobrescrever sessões existentes, chame sempre com `fromDate`
 *   após a última sessão gerada (ex: lastDate + 1 dia).
 */
exports.generateClassSessions = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idClass, classData, weeks = 4, fromDate = null } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!idClass || !classData) {
      throw new functions.https.HttpsError("invalid-argument", "idClass e classData são obrigatórios");
    }

    const weekday = classData.weekday ?? null;
    if (weekday === null || weekday === undefined) {
      throw new functions.https.HttpsError("invalid-argument", "weekday é obrigatório em classData");
    }

    // Helpers de data
    const addDays = (date, days) => {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
    };

    const toISODate = (value) => {
      const d = value instanceof Date ? value : new Date(value);
      return d.toISOString().slice(0, 10);
    };

    const findFirstWeekdayOnOrAfter = (startDateStr, targetWeekday) => {
      const start = new Date(startDateStr);
      for (let i = 0; i < 7; i += 1) {
        const candidate = addDays(start, i);
        if (candidate.getDay() === targetWeekday) return candidate;
      }
      return start;
    };

    const startDateStr = toISODate(fromDate || classData.startDate || new Date());
    const endDateStr = classData.endDate ? toISODate(classData.endDate) : null;

    const first = findFirstWeekdayOnOrAfter(startDateStr, weekday);
    const totalDays = Math.max(1, Number(weeks || 0) * 7);

    const sessionsCol = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("sessions");
    const batch = db.batch();

    const created = [];
    let ops = 0;

    const commitIfNeeded = async () => {
      if (ops >= 450) {
        await batch.commit();
        batch._ops = [];
        ops = 0;
      }
    };

    for (let i = 0; i < totalDays; i += 7) {
      const sessionDate = addDays(first, i);
      const iso = toISODate(sessionDate);
      if (endDateStr && iso > endDateStr) break;

      const idSession = `${idClass}-${iso}`;
      const ref = sessionsCol.doc(idSession);

      const payload = {
        idSession,
        idClass,
        idActivity: classData.idActivity || null,
        idStaff: classData.idStaff || null,
        idArea: classData.idArea || null,
        idTenant,
        idBranch,
        sessionDate: iso,
        weekday: Number(weekday),
        startTime: classData.startTime || "",
        endTime: classData.endTime || "",
        durationMinutes: Number(classData.durationMinutes || 0),
        maxCapacity: Number(classData.maxCapacity || classData.capacity || 0),
        status: "scheduled",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // set com merge=true pra tolerar reexecução sem estourar
      batch.set(ref, payload, { merge: true });
      ops += 1;
      created.push(payload);
      await commitIfNeeded();
    }

    if (ops > 0) {
      await batch.commit();
    }

    return created;
  });

/**
 * Cria uma turma (class).
 */
exports.createClass = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, classData } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!classData) {
      throw new functions.https.HttpsError("invalid-argument", "classData é obrigatório");
    }

    const classesCol = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("classes");
    const classRef = classesCol.doc();

    const payload = {
      ...classData,
      idTenant,
      idBranch,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await classRef.set(payload);

    return { id: classRef.id, ...payload };
  });

/**
 * Atualiza uma turma (class).
 */
exports.updateClass = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idClass, classData } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!idClass) {
      throw new functions.https.HttpsError("invalid-argument", "idClass é obrigatório");
    }

    if (!classData) {
      throw new functions.https.HttpsError("invalid-argument", "classData é obrigatório");
    }

    const classRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("classes")
      .doc(idClass);

    const payload = {
      ...classData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await classRef.update(payload);

    return { id: idClass, ...payload };
  });

/**
 * Deleta uma turma (class).
 */
exports.deleteClass = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch, idClass } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    if (!idClass) {
      throw new functions.https.HttpsError("invalid-argument", "idClass é obrigatório");
    }

    const classRef = db
      .collection("tenants")
      .doc(idTenant)
      .collection("branches")
      .doc(idBranch)
      .collection("classes")
      .doc(idClass);
    await classRef.delete();

    return { success: true };
  });
