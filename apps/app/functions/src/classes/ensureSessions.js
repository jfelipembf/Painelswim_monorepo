const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();

const { FieldValue } = require("firebase-admin/firestore");

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const toISODate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const findFirstWeekdayOnOrAfter = (startDateStr, weekday) => {
  const start = new Date(startDateStr);
  const target = Number(weekday);

  for (let i = 0; i < 7; i += 1) {
    const candidate = addDays(start, i);
    if (candidate.getDay() === target) return candidate;
  }
  return start;
};

const generateSessionsForClass = async ({
  idTenant,
  idBranch,
  idClass,
  classData,
  weeks = 2,
  fromDate = null,
}) => {
  if (!idTenant || !idBranch || !idClass || !classData) return { created: 0 };

  const weekday = classData.weekday ?? null;
  if (weekday === null || weekday === undefined) return { created: 0 };

  const startIso = toISODate(fromDate || classData.startDate || new Date());
  if (!startIso) return { created: 0 };

  const endDateStr = classData.endDate ? toISODate(classData.endDate) : null;

  const first = findFirstWeekdayOnOrAfter(startIso, weekday);
  const totalDays = Math.max(1, Number(weeks || 0) * 7);

  const sessionsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions");

  const enrollmentsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
  const enrSnap = await enrollmentsCol
    .where("type", "==", "recurring")
    .where("idClass", "==", idClass)
    .where("status", "==", "active")
    .get();
  const recurring = enrSnap.docs.map((d) => d.data() || {});

  const recurringCountForDate = (iso) => {
    if (!iso) return 0;
    let count = 0;
    for (const e of recurring) {
      const start = e.startDate ? String(e.startDate) : null;
      const end = e.endDate ? String(e.endDate) : null;
      if (start && iso < start) continue;
      if (end && iso > end) continue;
      count += 1;
    }
    return count;
  };

  let ops = 0;
  let createdCount = 0;
  let batch = db.batch();

  const commitIfNeeded = async () => {
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  };

  for (let i = 0; i < totalDays; i += 7) {
    const sessionDate = addDays(first, i);
    const iso = toISODate(sessionDate);
    if (!iso) continue;
    if (endDateStr && iso > endDateStr) break;

    const idSession = `${idClass}-${iso}`;
    const ref = sessionsCol.doc(idSession);

    const existingSnap = await ref.get();
    if (existingSnap.exists) {
      continue;
    }

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
      enrolledCount: recurringCountForDate(iso),
      status: "scheduled",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Also update existing sessions if they exist but have incorrect enrolledCount
    if (existingSnap.exists) {
      const existingData = existingSnap.data();
      if (existingData.enrolledCount !== payload.enrolledCount) {
        batch.update(ref, {
          enrolledCount: payload.enrolledCount,
          updatedAt: FieldValue.serverTimestamp(),
        });
        ops += 1;
        await commitIfNeeded();
      }
      continue;
    }

    batch.set(ref, payload);
    ops += 1;
    createdCount += 1;
    await commitIfNeeded();
  }

  if (ops > 0) {
    await batch.commit();
  }

  return { created: createdCount };
};

module.exports = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const idTenant = data?.idTenant ? String(data.idTenant) : null;
    const idBranch = data?.idBranch ? String(data.idBranch) : null;
    const targetDate = data?.targetDate ? String(data.targetDate) : null;

    if (!context?.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Auth obrigatório");
    }

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    const startIso = toISODate(targetDate || new Date());
    if (!startIso) {
      throw new functions.https.HttpsError("invalid-argument", "targetDate inválido");
    }

    const classesCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("classes");
    const classesSnap = await classesCol.get();

    let createdTotal = 0;

    for (const classDoc of classesSnap.docs) {
      const classData = classDoc.data() || {};
      const res = await generateSessionsForClass({
        idTenant,
        idBranch,
        idClass: classDoc.id,
        classData,
        weeks: 4,
        fromDate: startIso,
      });
      createdTotal += res.created;
    }

    functions.logger.info("ensureSessions", { idTenant, idBranch, startIso, createdTotal });

    return { ok: true, created: createdTotal };
  });
