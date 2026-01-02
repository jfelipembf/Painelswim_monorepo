import type { Sale } from "../../sales/sales.types";
import { toDateKeyUtc } from "../utils/date";

const filterActiveSales = (sales: Sale[]): Sale[] =>
  (sales || []).filter((sale) => sale.status !== "canceled");

const filterMembershipSales = (sales: Sale[]): Sale[] =>
  filterActiveSales(sales).filter(
    (sale) => Array.isArray(sale.items) && sale.items.some((item) => item?.type === "membership")
  );

const countUniqueClients = (sales: Sale[]): number =>
  new Set((sales || []).map((sale) => String(sale.clientId || "")).filter(Boolean)).size;

const sumPaidTotalCents = (sales: Sale[]): number =>
  (sales || []).reduce((acc, sale) => acc + Math.max(0, Number(sale.paidTotalCents || 0)), 0);

const buildSalesByDate = (sales: Sale[]): Map<string, number> => {
  const map = new Map<string, number>();
  filterActiveSales(sales).forEach((sale) => {
    const key = toDateKeyUtc(String(sale.dateKey || ""));
    if (!key) return;
    map.set(key, (map.get(key) || 0) + Number(sale.paidTotalCents || 0));
  });
  return map;
};

export { filterMembershipSales, countUniqueClients, sumPaidTotalCents, buildSalesByDate };
