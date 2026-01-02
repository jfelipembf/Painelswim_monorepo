import { WEEKDAY_SHORT_LABELS } from "constants/weekdays";

export const addDays = (date: Date, amount: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isSameDay = (a: Date, b: Date): boolean => {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
};

export const getStartOfWeekSunday = (date: Date): Date => {
  const d = startOfDay(date);
  const day = d.getDay();
  return addDays(d, -day);
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  return `${y}-${m}-${dd}`;
};

export const formatWeekRangeLabel = (start: Date, end: Date): string => {
  const cleanPtShort = (value: string) => String(value).replaceAll(" de ", " ").trim();

  const fmtStartRaw = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(start);

  const fmtEndRaw = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(end);

  const year = new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(end);

  const fmtStart = cleanPtShort(fmtStartRaw);
  const fmtEnd = cleanPtShort(fmtEndRaw);

  return `${fmtStart} - ${fmtEnd}, ${year}`;
};

export const formatDayHeaderLabel = (date: Date): string => {
  const dayName = WEEKDAY_SHORT_LABELS[date.getDay()] || "";
  const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
  return `${dayName} ${day}`;
};

export const timeToMinutes = (hhmm: string): number => {
  const parts = String(hhmm || "").split(":");
  if (parts.length !== 2) return Number.NaN;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.NaN;
  return h * 60 + m;
};

export const minutesToTime = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${pad2(h)}:${pad2(m)}`;
};
