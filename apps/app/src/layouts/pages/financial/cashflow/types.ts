export type CashflowTotals = {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
};

export type CashflowChartPoint = {
  dateKey: string;
  incomeCents: number;
  expenseCents: number;
};

export type CashflowTransaction = {
  id: string;
  dateKey: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amountCents: number;
};

export type CashflowData = {
  startDateKey: string;
  endDateKey: string;
  totals?: CashflowTotals;
  chart?: CashflowChartPoint[];
  transactions?: CashflowTransaction[];
};
