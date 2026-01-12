const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

const toMonthKey = (isoDate) => {
  if (!isoDate || typeof isoDate !== "string") return null;
  // expects YYYY-MM-DD
  if (isoDate.length < 7) return null;
  return isoDate.slice(0, 7);
};

const monthRangeFromKey = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null;
  const start = `${monthKey}-01`;
  const [y, m] = monthKey.split("-").map(Number);
  const endDate = new Date(Date.UTC(y, m, 0));
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
};

const normalizeWeekday = (weekday) => {
  if (weekday === null || weekday === undefined) return null;
  const n = Number(weekday);
  if (Number.isNaN(n)) return null;
  if (n === 7) return 0;
  if (n < 0 || n > 6) return null;
  return n;
};

const countWeekdayOccurrencesInRange = (rangeStartIso, rangeEndIso, weekday) => {
  const wd = normalizeWeekday(weekday);
  if (wd === null) return 0;
  if (!rangeStartIso || !rangeEndIso) return 0;

  const start = new Date(`${rangeStartIso}T00:00:00Z`);
  const end = new Date(`${rangeEndIso}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (start.getTime() > end.getTime()) return 0;

  const startDow = start.getUTCDay();
  const delta = (wd - startDow + 7) % 7;
  const first = new Date(start);
  first.setUTCDate(first.getUTCDate() + delta);
  if (first.getTime() > end.getTime()) return 0;

  const diffDays = Math.floor((end.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  return 1 + Math.floor(diffDays / 7);
};

const isPresentStatus = (status) => {
  if (status === null || status === undefined) return false;
  const n = Number(status);
  if (!Number.isNaN(n)) return n === 0;
  return String(status).toLowerCase() === "present";
};

const maxIso = (a, b) => (a >= b ? a : b);
const minIso = (a, b) => (a <= b ? a : b);

const calculateExpectedFromEnrollments = (enrollments, monthKey) => {
  const range = monthRangeFromKey(monthKey);
  if (!range) return 0;

  let expected = 0;
  for (const e of enrollments) {
    const weekday = normalizeWeekday(e?.weekday);
    if (weekday === null) continue;

    const startDate = typeof e?.startDate === "string" && e.startDate ? e.startDate : range.start;
    const endDate = typeof e?.endDate === "string" && e.endDate ? e.endDate : range.end;

    const effectiveStart = maxIso(range.start, startDate);
    const effectiveEnd = minIso(range.end, endDate);
    if (effectiveStart > effectiveEnd) continue;

    expected += countWeekdayOccurrencesInRange(effectiveStart, effectiveEnd, weekday);
  }

  return expected;
};

const recomputeClientMonthSummary = async ({ idTenant, idBranch, idClient, monthKey }) => {
  if (!idTenant || !idBranch || !idClient || !monthKey) return;
  const range = monthRangeFromKey(monthKey);
  if (!range) return;

  const attendanceCol = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("clients")
    .doc(idClient)
    .collection("attendance");

  const attSnap = await attendanceCol
    .where("sessionDate", ">=", range.start)
    .where("sessionDate", "<=", range.end)
    .get();

  let attended = 0;
  let absences = 0;
  for (const docSnap of attSnap.docs) {
    const d = docSnap.data() || {};
    if (isPresentStatus(d.status)) attended += 1;
    else absences += 1;
  }

  const enrollmentsCol = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("enrollments");

  const enrSnap = await enrollmentsCol
    .where("idClient", "==", idClient)
    .where("type", "==", "recurring")
    .where("status", "==", "active")
    .get();

  const enrollments = enrSnap.docs.map((d) => d.data() || {});
  const expected = calculateExpectedFromEnrollments(enrollments, monthKey);
  const frequency = expected > 0 ? (attended / expected) * 100 : 0;

  const summaryRef = db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("clients")
    .doc(idClient)
    .collection("attendanceMonthly")
    .doc(monthKey);

  await summaryRef.set(
    {
      month: monthKey,
      attended,
      absences,
      expected,
      frequency,
      updatedAt: FieldValue.serverTimestamp(),
      idTenant,
      idBranch,
      idClient,
    },
    { merge: true },
  );
};

exports.onAttendanceWrite = functions
  .region("us-central1")
  .firestore
  .document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}/attendance/{idSession}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch, idClient } = context.params;

    const after = change.after.exists ? (change.after.data() || {}) : null;
    const before = change.before.exists ? (change.before.data() || {}) : null;

    const sessionDate = (after && after.sessionDate) || (before && before.sessionDate) || null;
    const monthKey = toMonthKey(String(sessionDate || ""));
    if (!monthKey) return null;

    await recomputeClientMonthSummary({ idTenant, idBranch, idClient, monthKey });
    return null;
  });

exports.onEnrollmentWrite = functions
  .region("us-central1")
  .firestore
  .document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch } = context.params;

    const after = change.after.exists ? (change.after.data() || {}) : null;
    const before = change.before.exists ? (change.before.data() || {}) : null;

    const doc = after || before;
    if (!doc) return null;

    const type = String(doc.type || "").toLowerCase();
    if (type !== "recurring") return null;

    const idClient = doc.idClient;
    if (!idClient) return null;

    // recalcula mês atual e próximo (impacto no expected)
    const now = new Date();
    const mk0 = toMonthKey(now.toISOString().slice(0, 10));
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    const mk1 = toMonthKey(next.toISOString().slice(0, 10));

    if (mk0) await recomputeClientMonthSummary({ idTenant, idBranch, idClient, monthKey: mk0 });
    if (mk1 && mk1 !== mk0) await recomputeClientMonthSummary({ idTenant, idBranch, idClient, monthKey: mk1 });

    return null;
  });
