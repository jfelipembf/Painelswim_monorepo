const LOCALE = "pt-BR";
const CURRENCY = "BRL";

const formatCurrencyBRL = (value: number): string => {
  const normalized = Number(value || 0);
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(
    normalized
  );
};

const formatCentsBRL = (valueCents: number): string => {
  const normalized = Number(valueCents || 0) / 100;
  return formatCurrencyBRL(normalized);
};

export { formatCurrencyBRL, formatCentsBRL };
