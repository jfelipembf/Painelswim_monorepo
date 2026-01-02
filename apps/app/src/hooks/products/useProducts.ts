import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import type { Product, ProductPayload } from "../../modules/products";
import {
  createProduct,
  deleteProduct,
  fetchProductById,
  fetchProducts,
  normalizeProductPayload,
  updateProduct,
  validateProductPayload,
} from "../../modules/products";

export const useProducts = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    setLoading(true);
    setError(null);

    try {
      const list = await fetchProducts(idTenant, idBranch);
      setProducts(list);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const getById = useCallback(
    async (productId: string): Promise<Product | null> => {
      if (!idTenant || !idBranch) return null;
      return fetchProductById(idTenant, idBranch, productId);
    },
    [idBranch, idTenant]
  );

  const create = useCallback(
    async (payload: ProductPayload): Promise<string> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateProductPayload(payload);
      if (errors.length) throw new Error(errors[0]);

      const normalized = normalizeProductPayload(payload);
      const id = await createProduct(idTenant, idBranch, normalized);
      await refetch();
      return id;
    },
    [idBranch, idTenant, refetch]
  );

  const update = useCallback(
    async (productId: string, payload: Partial<ProductPayload>): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateProductPayload(payload);
      if (errors.length) throw new Error(errors[0]);

      await updateProduct(idTenant, idBranch, productId, payload);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const remove = useCallback(
    async (productId: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      await deleteProduct(idTenant, idBranch, productId);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  return {
    idTenant,
    idBranch,
    products,
    loading,
    error,
    refetch,
    getById,
    create,
    update,
    remove,
  };
};
