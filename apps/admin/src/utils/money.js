export const formatMoneyBRL = (value) => {
  if (value === null || value === undefined || value === "") return "";

  const numberValue = typeof value === "number" ? value : Number(String(value).replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(numberValue)) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue);
};
