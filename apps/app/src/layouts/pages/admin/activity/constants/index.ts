export const ACTIVITY_TABLE_ENTRIES = [5, 10, 15, 20, 25];

export const ACTIVITY_TABLE_LABELS = {
  entriesPerPage: "registros por página",
  searchPlaceholder: "Pesquisar...",
  totalEntries: (start: number, end: number, total: number) =>
    `Mostrando ${start} até ${end} de ${total} registros`,
};
