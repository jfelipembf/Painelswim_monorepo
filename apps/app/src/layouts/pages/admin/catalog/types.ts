import type { Product } from "hooks/products";
import type { Service } from "hooks/services";

export type CatalogTab = "products" | "services";
export type CatalogItem = Product | Service;
