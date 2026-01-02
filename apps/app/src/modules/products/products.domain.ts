import type { ProductPayload } from "./products.types";

export const validateProductPayload = (payload: Partial<ProductPayload>): string[] => {
  const errors: string[] = [];

  if (payload.name !== undefined && !String(payload.name || "").trim()) {
    errors.push("Nome do produto é obrigatório.");
  }

  const centsFields: Array<[keyof ProductPayload, string]> = [
    ["purchasePriceCents", "Valor de compra"],
    ["salePriceCents", "Valor de venda"],
  ];

  centsFields.forEach(([field, label]) => {
    const value = (payload as any)[field];
    if (value === undefined) return;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      errors.push(`${label} inválido.`);
    }
  });

  const qtyFields: Array<[keyof ProductPayload, string]> = [
    ["stockQty", "Estoque"],
    ["minStockQty", "Estoque mínimo"],
  ];

  qtyFields.forEach(([field, label]) => {
    const value = (payload as any)[field];
    if (value === undefined) return;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      errors.push(`${label} inválido.`);
    }
  });

  return errors;
};

export const normalizeProductPayload = (payload: ProductPayload): ProductPayload => {
  return {
    ...payload,
    name: String(payload.name || "").trim(),
    description: payload.description ? String(payload.description).trim() : "",
    purchasePriceCents: Math.round(Number(payload.purchasePriceCents || 0)),
    salePriceCents: Math.round(Number(payload.salePriceCents || 0)),
    sku: payload.sku ? String(payload.sku).trim() : "",
    barcode: payload.barcode ? String(payload.barcode).trim() : "",
    stockQty: Math.round(Number(payload.stockQty || 0)),
    minStockQty: Math.round(Number(payload.minStockQty || 0)),
    inactive: Boolean(payload.inactive),
  };
};
