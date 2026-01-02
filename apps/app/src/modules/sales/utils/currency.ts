const formatCentsBRL = (valueCents: number): string => {
  const value = Number(valueCents || 0) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const parseBRLToCents = (raw: string): number => {
  const normalized = String(raw ?? "")
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
};

export { formatCentsBRL, parseBRLToCents };
