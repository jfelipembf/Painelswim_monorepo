import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchClientById } from "../../modules/clients";
import type { Client } from "../../modules/clients";

type Options = {
  idTenant?: string;
  enabled?: boolean;
};

type Result = {
  data: Client | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useClient = (clientId?: string | null, options?: Options): Result => {
  const tenantFromStore = useAppSelector((state) => state.tenant.idTenant);
  const branchFromStore = useAppSelector((state) => state.branch.idBranch);

  const idTenant = options?.idTenant ?? tenantFromStore;
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !idTenant || !branchFromStore || !clientId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = await fetchClientById(idTenant, branchFromStore, clientId);
      setData(client);
    } catch (e: unknown) {
      setData(null);
      setError(e instanceof Error ? e.message : "Não foi possível buscar cliente.");
    } finally {
      setLoading(false);
    }
  }, [branchFromStore, clientId, enabled, idTenant]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      await refetch();
    };

    run().catch(() => {
      if (!active) return;
    });

    return () => {
      active = false;
    };
  }, [refetch]);

  return { data, loading, error, refetch };
};
