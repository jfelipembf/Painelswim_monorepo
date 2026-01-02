import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import type { Service, ServicePayload } from "../../modules/services";
import {
  createService,
  deleteService,
  fetchServiceById,
  fetchServices,
  normalizeServicePayload,
  updateService,
  validateServicePayload,
} from "../../modules/services";

export const useServices = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    setLoading(true);
    setError(null);

    try {
      const list = await fetchServices(idTenant, idBranch);
      setServices(list);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const getById = useCallback(
    async (serviceId: string): Promise<Service | null> => {
      if (!idTenant || !idBranch) return null;
      return fetchServiceById(idTenant, idBranch, serviceId);
    },
    [idBranch, idTenant]
  );

  const create = useCallback(
    async (payload: ServicePayload): Promise<string> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateServicePayload(payload);
      if (errors.length) throw new Error(errors[0]);

      const normalized = normalizeServicePayload(payload);
      const id = await createService(idTenant, idBranch, normalized);
      await refetch();
      return id;
    },
    [idBranch, idTenant, refetch]
  );

  const update = useCallback(
    async (serviceId: string, payload: Partial<ServicePayload>): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateServicePayload(payload);
      if (errors.length) throw new Error(errors[0]);

      await updateService(idTenant, idBranch, serviceId, payload);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const remove = useCallback(
    async (serviceId: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      await deleteService(idTenant, idBranch, serviceId);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  return {
    idTenant,
    idBranch,
    services,
    loading,
    error,
    refetch,
    getById,
    create,
    update,
    remove,
  };
};
