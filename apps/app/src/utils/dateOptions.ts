import { MONTHS } from "constants/months";

type MonthOption = { value: string; label: string };

const pad2 = (n: number) => String(n).padStart(2, "0");

export const buildRecentMonthsOptions = (
  count: number,
  baseDate: Date = new Date()
): MonthOption[] => {
  const safeCount = Math.max(1, Math.min(48, Math.floor(Number(count) || 0)));
  const d = new Date(baseDate);
  d.setDate(1);

  const options: MonthOption[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthValue = pad2(month);
    const value = `${year}-${monthValue}`;

    const monthLabel = MONTHS.find((m) => String(m.value) === String(month))?.label || monthValue;
    const short = String(monthLabel).slice(0, 3);
    const label = `${short}/${year}`;

    options.push({ value, label });

    d.setMonth(d.getMonth() - 1);
  }

  return options;
};
