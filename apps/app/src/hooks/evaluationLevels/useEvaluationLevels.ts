import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import type { EvaluationLevel, EvaluationLevelPayload } from "../../modules/evaluationLevels";
import {
  createEvaluationLevel,
  deleteEvaluationLevel,
  fetchEvaluationLevels,
  getNextEvaluationLevelOrder,
  normalizeEvaluationLevelPayload,
  updateEvaluationLevel,
  validateEvaluationLevelPayload,
} from "../../modules/evaluationLevels";

export const useEvaluationLevels = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [levels, setLevels] = useState<EvaluationLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    setLoading(true);
    setError(null);

    try {
      const list = await fetchEvaluationLevels(idTenant, idBranch);
      setLevels(list);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar níveis.");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const sortedLevels = useMemo(() => {
    return [...levels].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [levels]);

  const createLevel = useCallback(
    async (payload: EvaluationLevelPayload): Promise<string> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const normalized = normalizeEvaluationLevelPayload(payload);
      const errors = validateEvaluationLevelPayload(normalized);
      if (errors.length) throw new Error(errors[0]);

      const nextOrder =
        typeof normalized.order === "number"
          ? Math.max(0, Math.round(normalized.order))
          : await getNextEvaluationLevelOrder(idTenant, idBranch);

      const id = await createEvaluationLevel(idTenant, idBranch, {
        ...normalized,
        order: nextOrder,
        inactive: Boolean(normalized.inactive),
      });

      await refetch();
      return id;
    },
    [idBranch, idTenant, refetch]
  );

  const updateLevel = useCallback(
    async (levelId: string, payload: Partial<EvaluationLevelPayload>): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");
      if (!levelId) throw new Error("Nível não identificado.");

      if (payload.name !== undefined || payload.value !== undefined) {
        const errors = validateEvaluationLevelPayload({
          name: payload.name !== undefined ? payload.name : "ok",
          value: payload.value !== undefined ? payload.value : 0,
        });
        if (errors.length) throw new Error(errors[0]);
      }

      await updateEvaluationLevel(idTenant, idBranch, levelId, payload);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const removeLevel = useCallback(
    async (levelId: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      await deleteEvaluationLevel(idTenant, idBranch, levelId);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const reorderLevels = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const indexById = new Map(orderedIds.map((id, idx) => [id, idx]));
      const updates = sortedLevels
        .filter((lvl) => indexById.has(lvl.id))
        .map((lvl) => ({ id: lvl.id, nextOrder: indexById.get(lvl.id) || 0 }));

      for (const u of updates) {
        await updateEvaluationLevel(idTenant, idBranch, u.id, { order: u.nextOrder });
      }

      await refetch();
    },
    [idBranch, idTenant, refetch, sortedLevels]
  );

  return {
    levels,
    sortedLevels,
    loading,
    error,
    refetch,
    createLevel,
    updateLevel,
    removeLevel,
    reorderLevels,
  };
};
