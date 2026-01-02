import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import type { TestDefinition, TestDefinitionPayload } from "../../modules/tests";
import {
  createTestDefinition,
  deleteTestDefinition,
  fetchTestDefinitions,
  normalizeTestDefinitionPayload,
  updateTestDefinition,
  validateTestDefinitionPayload,
} from "../../modules/tests";

export const useTests = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    setLoading(true);
    setError(null);

    try {
      const list = await fetchTestDefinitions(idTenant, idBranch);
      setTests(list);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar testes.");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createTest = useCallback(
    async (payload: TestDefinitionPayload): Promise<string> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const normalized = normalizeTestDefinitionPayload(payload);
      const errors = validateTestDefinitionPayload(normalized);
      if (errors.length) throw new Error(errors[0]);

      const id = await createTestDefinition(idTenant, idBranch, normalized);
      await refetch();
      return id;
    },
    [idBranch, idTenant, refetch]
  );

  const updateTest = useCallback(
    async (testId: string, payload: Partial<TestDefinitionPayload>): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      if (payload.name !== undefined || payload.mode !== undefined) {
        const normalized = normalizeTestDefinitionPayload({
          ...payload,
          // ensure we validate with a default mode if user is only editing name
          mode: payload.mode,
        });
        const errors = validateTestDefinitionPayload({
          name: normalized.name,
          mode: normalized.mode,
          fixedDistanceMeters: normalized.fixedDistanceMeters,
          fixedTimeSeconds: normalized.fixedTimeSeconds,
        });
        if (errors.length) throw new Error(errors[0]);
      }

      await updateTestDefinition(idTenant, idBranch, testId, payload);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const removeTest = useCallback(
    async (testId: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      await deleteTestDefinition(idTenant, idBranch, testId);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  return {
    tests,
    loading,
    error,
    refetch,
    createTest,
    updateTest,
    removeTest,
  };
};
