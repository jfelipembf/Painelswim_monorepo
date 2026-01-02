export const toDateKey = (value?: string): string => String(value || "").slice(0, 10);

export const formatDateBr = (value?: string): string => {
  const key = toDateKey(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
  const [year, month, day] = key.split("-");
  return `${day}-${month}-${year}`;
};

export const toDateKeyFromUnknown = (value: unknown): string => {
  if (!value) return "";

  if (typeof value === "string") return toDateKey(value);

  if (value instanceof Date) return toDateKey(value.toISOString());

  if (typeof value === "number") return toDateKey(new Date(value).toISOString());

  if (typeof value === "object") {
    const seconds = (value as any).seconds;
    const nanos = (value as any).nanoseconds;
    if (Number.isFinite(Number(seconds))) {
      const millis = Number(seconds) * 1000 + (Number(nanos) || 0) / 1_000_000;
      return toDateKey(new Date(millis).toISOString());
    }
    const iso = (value as any).toISOString?.();
    if (typeof iso === "string") return toDateKey(iso);
  }

  return "";
};

export const formatDateFromUnknown = (value: unknown): string => {
  const key = toDateKeyFromUnknown(value);
  return formatDateBr(key);
};

export const addDaysDateKey = (dateKey: string, days: number): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "";
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + Number(days || 0));
  return String(base.toISOString()).slice(0, 10);
};
