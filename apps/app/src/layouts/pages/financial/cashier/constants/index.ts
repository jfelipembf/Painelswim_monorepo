const CASHIER_EXIT_CATEGORIES = [
  "Despesa Operacional",
  "Pagamento de Funcionário",
  "Manutenção",
  "Retirada/Sangria",
  "Outros",
] as const;

const CASHIER_TABLE_COLUMNS = [
  { Header: "horário", accessor: "time", width: "15%" },
  { Header: "descrição", accessor: "description", width: "50%" },
  { Header: "tipo", accessor: "type", align: "center", width: "15%" },
  { Header: "valor", accessor: "value", align: "right" },
];

export { CASHIER_EXIT_CATEGORIES, CASHIER_TABLE_COLUMNS };
