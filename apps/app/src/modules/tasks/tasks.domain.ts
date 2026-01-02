export const toDateKey = (date: Date): string => String(date.toISOString()).slice(0, 10);

export const normalizeTaskTitle = (value: string): string => String(value || "").trim();
