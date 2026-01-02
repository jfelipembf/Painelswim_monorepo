import * as admin from "firebase-admin";

export const toDateKey = (value: string): string => String(value || "").slice(0, 10);

export const isValidDateKey = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const toDayKey = (value: string): string => {
  const key = toDateKey(value);
  return isValidDateKey(key) ? key : "";
};

export const toMonthKey = (value: string): string => {
  const dayKey = toDayKey(value);
  return dayKey ? dayKey.slice(0, 7) : "";
};

export const toDateKeyFromValue = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return toDateKey(value);
  if (value instanceof admin.firestore.Timestamp) {
    return toDateKey(value.toDate().toISOString());
  }
  if (value instanceof Date) return toDateKey(value.toISOString());
  const maybeToDate = (value as { toDate?: () => Date }).toDate;
  if (typeof maybeToDate === "function") {
    const date = maybeToDate.call(value);
    if (date instanceof Date) return toDateKey(date.toISOString());
  }
  return toDateKey(String(value));
};

export const parseIsoDate = (value: string): Date | null => {
  const key = toDayKey(value);
  if (!key) return null;
  const date = new Date(`${key}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) ? date : null;
};

export const addDays = (d: Date, days: number): Date => {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const formatIsoDate = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const withinRange = (iso: string, start: string, end: string): boolean => {
  const key = toDateKey(iso);
  return key >= toDateKey(start) && key <= toDateKey(end);
};
