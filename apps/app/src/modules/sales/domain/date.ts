const addMonthsIsoDateKey = (dateKey: string, monthsToAdd: number): string => {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCMonth(base.getUTCMonth() + Number(monthsToAdd || 0));
  return String(base.toISOString()).slice(0, 10);
};

const addDaysIsoDateKey = (dateKey: string, daysToAdd: number): string => {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + Number(daysToAdd || 0));
  return String(base.toISOString()).slice(0, 10);
};

const addYearsIsoDateKey = (dateKey: string, yearsToAdd: number): string => {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  base.setUTCFullYear(base.getUTCFullYear() + Number(yearsToAdd || 0));
  return String(base.toISOString()).slice(0, 10);
};

const toIsoDateKey = (iso: string): string => String(iso || "").slice(0, 10);

const getTodayDateKey = (): string => String(new Date().toISOString()).slice(0, 10);

const buildBranchDateKey = (dateKey: string, branchId: string): string => `${dateKey}_${branchId}`;

export {
  addMonthsIsoDateKey,
  addDaysIsoDateKey,
  addYearsIsoDateKey,
  toIsoDateKey,
  getTodayDateKey,
  buildBranchDateKey,
};
