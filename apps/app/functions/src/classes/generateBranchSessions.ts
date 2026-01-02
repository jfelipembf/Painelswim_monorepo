import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onCall, HttpsError } from "firebase-functions/v2/https";

import {
  BulkWriterErrorLike,
  addDays,
  formatIsoDate,
  isValidDateKey,
  parseIsoDate,
  shouldRetryBulkWriter,
  toDateKey,
  toDateKeyFromValue,
  withinRange,
} from "../shared";

type GenerateBranchSessionsRequest = {
  idTenant: string;
  idBranch: string;
  startDate: string;
  endDate: string;
};

const computeEndTime = (startTime: string, durationMinutes: number): string => {
  const parts = String(startTime || "").split(":");
  if (parts.length !== 2) return "";
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";

  const duration = Number(durationMinutes || 0);
  if (!Number.isFinite(duration) || duration <= 0) return "";

  const totalMinutes = hours * 60 + minutes + duration;
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const endHours = Math.floor(normalized / 60);
  const endMinutes = normalized % 60;
  const formattedHours = String(endHours).padStart(2, "0");
  const formattedMinutes = String(endMinutes).padStart(2, "0");
  return `${formattedHours}:${formattedMinutes}`;
};

type EnrollmentRange = {
  startKey: string;
  endKey?: string;
};

type EnrollmentDocData = {
  effectiveFrom?: unknown;
  effectiveTo?: unknown;
  startDate?: unknown;
  createdAt?: unknown;
};

const loadEnrollmentRangesForClass = async (
  db: admin.firestore.Firestore,
  idTenant: string,
  idBranch: string,
  idClass: string
): Promise<EnrollmentRange[]> => {
  const snap = await db
    .collectionGroup("enrollments")
    .where("idTenant", "==", idTenant)
    .where("idBranch", "==", idBranch)
    .where("idClass", "==", idClass)
    .where("status", "==", "active")
    .get();

  const ranges: EnrollmentRange[] = [];
  snap.docs.forEach((doc) => {
    const data = doc.data() as EnrollmentDocData;
    const startKey = toDateKeyFromValue(data?.effectiveFrom || data?.startDate || data?.createdAt);
    if (!isValidDateKey(startKey)) return;

    const rawEnd = toDateKeyFromValue(data?.effectiveTo);
    const endKey = rawEnd && isValidDateKey(rawEnd) ? rawEnd : "";
    if (endKey && endKey < startKey) return;

    ranges.push({ startKey, endKey: endKey || undefined });
  });

  return ranges;
};

const countEnrollmentsForDate = (dateKey: string, ranges: EnrollmentRange[]): number => {
  if (!isValidDateKey(dateKey)) return 0;
  let count = 0;
  ranges.forEach((range) => {
    if (dateKey < range.startKey) return;
    if (range.endKey && dateKey > range.endKey) return;
    count += 1;
  });
  return count;
};

export const generateBranchSessions = onCall(async (req) => {
  const data = (req.data || {}) as GenerateBranchSessionsRequest;

  const idTenant = String(data.idTenant || "").trim();
  const idBranch = String(data.idBranch || "").trim();
  const startDate = toDateKey(String(data.startDate || ""));
  const endDate = toDateKey(String(data.endDate || ""));

  if (!idTenant || !idBranch) {
    throw new HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios.");
  }

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end < start) {
    throw new HttpsError("invalid-argument", "Intervalo de datas inválido.");
  }

  const db = admin.firestore();
  const writer = db.bulkWriter();
  let createdSessions = 0;

  writer.onWriteResult(() => {
    createdSessions += 1;
  });

  writer.onWriteError((error: BulkWriterErrorLike) => {
    const code = error.code;
    const message = String(error.message || "");
    const isAlreadyExists =
      code === 6 || code === "already-exists" || message.includes("ALREADY_EXISTS");

    if (isAlreadyExists) return false;
    return shouldRetryBulkWriter(error);
  });

  const classesSnap = await db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("classes")
    .get();

  type RawClassDoc = {
    id?: string;
    weekday?: number;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    maxCapacity?: number;
    idActivity?: string;
    idArea?: string;
    idEmployee?: string;
  };

  const classes: RawClassDoc[] = classesSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as RawClassDoc),
  }));

  for (const raw of classes) {
    const classId = String(raw.id || "");
    const weekday = Number(raw.weekday);
    const classStartDate = toDateKey(String(raw.startDate || ""));
    const classEndDate = raw.endDate ? toDateKey(String(raw.endDate)) : "";

    const startTime = String(raw.startTime || "");
    const durationMinutes = Number(raw.durationMinutes || 0);
    const endTime = String(raw.endTime || computeEndTime(startTime, durationMinutes));

    const maxCapacity = Number(raw.maxCapacity || 0);

    const idActivity = String(raw.idActivity || "");
    const idArea = String(raw.idArea || "");
    const idEmployee = String(raw.idEmployee || "");

    if (!classId || !Number.isFinite(weekday)) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(classStartDate)) continue;

    const enrollmentRanges = await loadEnrollmentRangesForClass(db, idTenant, idBranch, classId);

    const effectiveStart = toDateKey(startDate) < classStartDate ? classStartDate : startDate;
    const effectiveEnd = classEndDate && classEndDate < toDateKey(endDate) ? classEndDate : endDate;

    let cursor = parseIsoDate(effectiveStart);
    const endCursor = parseIsoDate(effectiveEnd);
    if (!cursor || !endCursor) continue;

    while (cursor <= endCursor) {
      const iso = formatIsoDate(cursor);
      const dayIndex = cursor.getUTCDay();
      if (dayIndex === weekday && withinRange(iso, effectiveStart, effectiveEnd)) {
        const enrolledCount = countEnrollmentsForDate(iso, enrollmentRanges);
        const sessionId = `${classId}_${iso}`;
        const sessionRef = db
          .collection("tenants")
          .doc(idTenant)
          .collection("branches")
          .doc(idBranch)
          .collection("classSessions")
          .doc(sessionId);

        const sessionData = {
          idTenant,
          idBranch,
          idClass: classId,
          idActivity,
          idArea,
          idEmployee,
          sessionDate: iso,
          startTime,
          endTime,
          durationMinutes,
          maxCapacity,
          enrolledCount,
          status: "scheduled",
          updatedAt: FieldValue.serverTimestamp(),
        };

        writer.create(sessionRef, {
          ...sessionData,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      cursor = addDays(cursor, 1);
    }
  }

  await writer.close();
  return { ok: true, createdSessions };
});
