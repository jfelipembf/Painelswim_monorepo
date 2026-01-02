import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import type { Activity, ActivityPayload } from "../../modules/activities";
import {
  createActivity,
  deleteActivity,
  fetchActivities,
  fetchActivityById,
  normalizeActivityPayload,
  syncActivityObjectives,
  updateActivity,
  validateActivityPayload,
} from "../../modules/activities";

export const useActivities = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    setLoading(true);
    setError(null);

    try {
      const list = await fetchActivities(idTenant, idBranch);
      setActivities(list);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar atividades");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const getById = useCallback(
    async (activityId: string): Promise<Activity | null> => {
      if (!idTenant || !idBranch) return null;
      return fetchActivityById(idTenant, idBranch, activityId);
    },
    [idBranch, idTenant]
  );

  const create = useCallback(
    async (payload: ActivityPayload): Promise<string> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateActivityPayload(payload);
      if (errors.length) throw new Error(errors[0]);

      const normalized = normalizeActivityPayload(payload);
      const id = await createActivity(idTenant, idBranch, normalized);

      if (Array.isArray(normalized.objectives) && normalized.objectives.length) {
        await syncActivityObjectives(idTenant, idBranch, id, normalized.objectives);
      }

      await refetch();
      return id;
    },
    [idBranch, idTenant, refetch]
  );

  const update = useCallback(
    async (activityId: string, payload: Partial<ActivityPayload>): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateActivityPayload(payload);
      if (errors.length) throw new Error(errors[0]);

      const { objectives, ...rest } = payload;

      if (objectives !== undefined) {
        await syncActivityObjectives(idTenant, idBranch, activityId, objectives);
      }

      await updateActivity(idTenant, idBranch, activityId, rest);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const remove = useCallback(
    async (activityId: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");
      await deleteActivity(idTenant, idBranch, activityId);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  return {
    idTenant,
    idBranch,
    activities,
    loading,
    error,
    refetch,
    getById,
    create,
    update,
    remove,
  };
};
