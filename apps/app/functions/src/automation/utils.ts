import * as admin from "firebase-admin";

const toDateKeyUtc = (date: Date): string => {
  return String(date.toISOString()).slice(0, 10);
};

const parseBirthMonthDay = (value: string): { month: string; day: string } | null => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return { month: isoMatch[2], day: isoMatch[3] };
  }

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return { month: brMatch[2], day: brMatch[1] };
  }

  const dashMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dashMatch) {
    return { month: dashMatch[2], day: dashMatch[1] };
  }

  return null;
};

const addDaysDateKeyUtc = (dateKey: string, days: number): string => {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + Number(days || 0));
  return String(base.toISOString()).slice(0, 10);
};

const diffDaysDateKeyUtc = (startKey: string, endKey: string): number => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startKey) || !/^\d{4}-\d{2}-\d{2}$/.test(endKey)) {
    return 0;
  }
  const start = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

const computeEndAtFromStart = (
  startAtIso: string,
  durationType: string,
  duration: number
): string | null => {
  const startKey = String(startAtIso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startKey)) return null;
  const n = Math.max(1, Number(duration || 1));

  const exclusiveEndKey =
    durationType === "day"
      ? addDaysDateKeyUtc(startKey, n)
      : durationType === "week"
      ? addDaysDateKeyUtc(startKey, n * 7)
      : durationType === "month"
      ? (() => {
          const d = new Date(`${startKey}T00:00:00.000Z`);
          d.setUTCMonth(d.getUTCMonth() + n);
          return String(d.toISOString()).slice(0, 10);
        })()
      : (() => {
          const d = new Date(`${startKey}T00:00:00.000Z`);
          d.setUTCFullYear(d.getUTCFullYear() + n);
          return String(d.toISOString()).slice(0, 10);
        })();

  return addDaysDateKeyUtc(exclusiveEndKey, -1);
};

const chunk = <T>(arr: T[], size: number): T[][] => {
  const n = Math.max(1, Number(size || 1));
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += n) res.push(arr.slice(i, i + n));
  return res;
};

const isActiveOn = (m: admin.firestore.DocumentData, dateKey: string, graceDays = 0): boolean => {
  const status = String(m?.status || "");
  if (status === "canceled") return false;

  const startAt = String(m?.startAt || "").slice(0, 10);
  if (!startAt) return false;

  const endAt = String(m?.endAt || "").slice(0, 10);
  const safeGrace = Math.max(0, Number(graceDays || 0));
  const effectiveEndAt = endAt && safeGrace ? addDaysDateKeyUtc(endAt, safeGrace) : endAt;
  return startAt <= dateKey && (!endAt || effectiveEndAt >= dateKey);
};

export {
  addDaysDateKeyUtc,
  chunk,
  computeEndAtFromStart,
  diffDaysDateKeyUtc,
  isActiveOn,
  parseBirthMonthDay,
  toDateKeyUtc,
};
