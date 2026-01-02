import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import type { Product, ProductPayload } from "./products.types";

type ProductDocData = Omit<Product, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const removeUndefinedFields = <T extends Record<string, any>>(value: T): Partial<T> => {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
};

const mapProductDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: ProductDocData
): Product => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: String(raw.idBranch || idBranch),
  name: String(raw.name || ""),
  description: raw.description,
  purchasePriceCents: Number(raw.purchasePriceCents || 0),
  salePriceCents: Number(raw.salePriceCents || 0),
  sku: raw.sku,
  barcode: raw.barcode,
  stockQty: Number(raw.stockQty || 0),
  minStockQty: Number(raw.minStockQty || 0),
  inactive: Boolean(raw.inactive),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const fetchProducts = async (idTenant: string, idBranch: string): Promise<Product[]> => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const ref = collection(db, "tenants", idTenant, "branches", idBranch, "products");
  const snap = await getDocs(query(ref));
  return snap.docs.map((d) => mapProductDoc(idTenant, idBranch, d.id, d.data() as ProductDocData));
};

export const fetchProductById = async (
  idTenant: string,
  idBranch: string,
  productId: string
): Promise<Product | null> => {
  if (!idTenant || !idBranch || !productId) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "products", productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapProductDoc(idTenant, idBranch, snap.id, snap.data() as ProductDocData);
};

export const createProduct = async (
  idTenant: string,
  idBranch: string,
  payload: ProductPayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

  const db = getFirebaseDb();
  const ref = doc(collection(db, "tenants", idTenant, "branches", idBranch, "products"));

  await setDoc(
    ref,
    removeUndefinedFields({
      idTenant,
      idBranch,
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return ref.id;
};

export const updateProduct = async (
  idTenant: string,
  idBranch: string,
  productId: string,
  payload: Partial<ProductPayload>
): Promise<void> => {
  if (!idTenant || !idBranch || !productId) throw new Error("Produto não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "products", productId);

  const updateData = removeUndefinedFields({
    ...payload,
    name: payload.name !== undefined ? String(payload.name).trim() : undefined,
    description: payload.description !== undefined ? String(payload.description).trim() : undefined,
    purchasePriceCents:
      payload.purchasePriceCents !== undefined
        ? Math.round(Number(payload.purchasePriceCents || 0))
        : undefined,
    salePriceCents:
      payload.salePriceCents !== undefined
        ? Math.round(Number(payload.salePriceCents || 0))
        : undefined,
    sku: payload.sku !== undefined ? String(payload.sku).trim() : undefined,
    barcode: payload.barcode !== undefined ? String(payload.barcode).trim() : undefined,
    stockQty:
      payload.stockQty !== undefined ? Math.round(Number(payload.stockQty || 0)) : undefined,
    minStockQty:
      payload.minStockQty !== undefined ? Math.round(Number(payload.minStockQty || 0)) : undefined,
    inactive: payload.inactive !== undefined ? Boolean(payload.inactive) : undefined,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, updateData);
};

export const deleteProduct = async (
  idTenant: string,
  idBranch: string,
  productId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !productId) throw new Error("Produto não identificado.");

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "products", productId);
  await deleteDoc(ref);
};
