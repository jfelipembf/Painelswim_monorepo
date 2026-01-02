import type { EnrollmentDoc } from "./enrollments.types";

export const toDateKey = (value: any): string => {
  if (!value) return "";

  // Firestore Timestamp shape: { seconds, nanoseconds }
  if (typeof value === "object") {
    const seconds = (value as any)?.seconds;
    if (Number.isFinite(Number(seconds))) {
      return String(new Date(Number(seconds) * 1000).toISOString()).slice(0, 10);
    }

    if (value instanceof Date) {
      return String(value.toISOString()).slice(0, 10);
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(new Date(value).toISOString()).slice(0, 10);
  }

  return String(value || "").slice(0, 10);
};

export const isEnrollmentActiveOnDate = (enrollment: EnrollmentDoc, dateKey: string): boolean => {
  if ((enrollment as any)?.status === "inactive") return false;
  const d = toDateKey(dateKey);
  const from = toDateKey((enrollment as any).effectiveFrom);
  const to = (enrollment as any).effectiveTo ? toDateKey((enrollment as any).effectiveTo) : "";

  if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;

  if (d < from) return false;
  if (to && d > to) return false;
  return true;
};

export const assertDateKey = (value: string, message: string): void => {
  const k = toDateKey(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) throw new Error(message);
};
