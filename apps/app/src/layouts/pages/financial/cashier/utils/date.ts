const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const formatFirestoreTime = (createdAt: any): string => {
  const sec = Number(createdAt?.seconds || 0);
  if (!sec) return "—";
  const d = new Date(sec * 1000);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const startOfLocalDay = (value: Date): Date => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfLocalDay = (value: Date): Date => {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
};

const toUtcDateKey = (value: Date): string => String(value.toISOString()).slice(0, 10);

const parseDateKey = (value: string | null): string | null => {
  const v = String(value || "").slice(0, 10);
  return DATE_KEY_REGEX.test(v) ? v : null;
};

const formatLocalDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toCreatedAtMillis = (value: any): number | null => {
  if (!value) return null;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value?.toMillis === "function") return value.toMillis();
  return null;
};

const isWithinLocalRange = (createdAt: any, start: Date, end: Date): boolean => {
  const millis = toCreatedAtMillis(createdAt);
  if (!millis) return true;
  return millis >= start.getTime() && millis <= end.getTime();
};

export {
  endOfLocalDay,
  formatFirestoreTime,
  formatLocalDateKey,
  isWithinLocalRange,
  parseDateKey,
  startOfLocalDay,
  toCreatedAtMillis,
  toUtcDateKey,
};
