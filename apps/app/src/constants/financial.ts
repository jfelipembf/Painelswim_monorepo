export const CASHFLOW_TYPE_LABELS = {
  income: "Entrada",
  expense: "Saída",
} as const;

export const CASHFLOW_TYPE_BADGES = {
  income: { label: "ENTRADA", color: "success" },
  expense: { label: "SAÍDA", color: "error" },
} as const;

export const CASHFLOW_TYPE_SIGNS = {
  income: "+",
  expense: "-",
} as const;
