import * as admin from "firebase-admin";

const dateKeyFromSessionId = (sessionId: string): string => {
  const candidate = String(sessionId || "").slice(-10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : "";
};

const dateKeyFromTimestamp = (
  value: admin.firestore.Timestamp | { toDate?: () => Date } | null | undefined
): string => {
  if (!value) return "";
  const ts = typeof value.toDate === "function" ? value.toDate() : null;
  if (!ts) return "";
  return String(ts.toISOString()).slice(0, 10);
};

const hourKeyFromTime = (value: string | number | null | undefined): string => {
  const raw = String(value || "");
  if (!raw) return "";
  const hour = Number(raw.split(":")[0]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return "";
  return String(hour).padStart(2, "0");
};

const hourKeyFromAttendance = (value: admin.firestore.DocumentData | undefined): string => {
  return hourKeyFromTime(value?.sessionStartTime || value?.startTime);
};

export { dateKeyFromSessionId, dateKeyFromTimestamp, hourKeyFromAttendance, hourKeyFromTime };
