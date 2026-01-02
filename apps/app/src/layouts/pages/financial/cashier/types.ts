export type CashierRow = {
  id: string;
  description: string;
  type: "income" | "expense";
  value: number;
  time: string;
  clientLabel?: string;
};

export type CashierRange = {
  start: Date;
  end: Date;
};
