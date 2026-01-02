export type Product = {
  id: string;
  idTenant: string;
  idBranch: string;
  name: string;
  description?: string;
  purchasePriceCents: number;
  salePriceCents: number;
  sku?: string;
  barcode?: string;
  stockQty: number;
  minStockQty: number;
  inactive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ProductPayload = {
  name: string;
  description?: string;
  purchasePriceCents: number;
  salePriceCents: number;
  sku?: string;
  barcode?: string;
  stockQty: number;
  minStockQty: number;
  inactive: boolean;
};
