import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import type { Area, AreaPayload } from "../../modules/areas";
import {
  createArea,
  deleteArea,
  fetchAreaById,
  fetchAreas,
  normalizeAreaPayload,
  updateArea,
  validateAreaPayload,
} from "../../modules/areas";

export const useAreas = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    setLoading(true);
    setError(null);

    try {
      const list = await fetchAreas(idTenant, idBranch);
      setAreas(list);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar áreas");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const getById = useCallback(
    async (areaId: string): Promise<Area | null> => {
      if (!idTenant || !idBranch) return null;
      return fetchAreaById(idTenant, idBranch, areaId);
    },
    [idBranch, idTenant]
  );

  const create = useCallback(
    async (payload: AreaPayload): Promise<string> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateAreaPayload(payload);
      if (errors.length) throw new Error(errors[0]);

      const normalized = normalizeAreaPayload(payload);
      const id = await createArea(idTenant, idBranch, normalized);
      await refetch();
      return id;
    },
    [idBranch, idTenant, refetch]
  );

  const update = useCallback(
    async (areaId: string, payload: Partial<AreaPayload>): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateAreaPayload(payload);
      if (errors.length) throw new Error(errors[0]);

      await updateArea(idTenant, idBranch, areaId, payload);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const remove = useCallback(
    async (areaId: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      await deleteArea(idTenant, idBranch, areaId);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  return {
    idTenant,
    idBranch,
    areas,
    loading,
    error,
    refetch,
    getById,
    create,
    update,
    remove,
  };
};
