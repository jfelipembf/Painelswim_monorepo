const toMonthKey = (date: Date): string => {
  const iso = String(date.toISOString());
  return iso.slice(0, 7);
};

const toDateKey = (date: Date): string => String(date.toISOString()).slice(0, 10);

const toDateKeyUtc = (value: string): string => String(value || "").slice(0, 10);

const getMonthRange = (date: Date): { startDateKey: string; endDateKey: string } => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { startDateKey: toDateKey(start), endDateKey: toDateKey(end) };
};

const buildDateKeysRange = (startDateKey: string, endDateKey: string): string[] => {
  const start = new Date(`${startDateKey}T00:00:00.000Z`);
  const end = new Date(`${endDateKey}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(String(cursor.toISOString()).slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
};

const formatDayLabelPt = (dateKey: string): string => {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
};

const monthLabelsPt = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const buildYearMonthKeys = (year: number): string[] =>
  Array.from({ length: 12 }, (_, idx) => `${year}-${String(idx + 1).padStart(2, "0")}`);

export {
  toMonthKey,
  toDateKey,
  toDateKeyUtc,
  getMonthRange,
  buildDateKeysRange,
  formatDayLabelPt,
  monthLabelsPt,
  buildYearMonthKeys,
};
