import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchClients } from "../../modules/clients";
import type { Client } from "../../modules/clients";

type Options = {
  idTenant?: string;
  idBranch?: string | null;
  enabled?: boolean;
};

type Result = {
  data: Client[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useClientsList = (options?: Options): Result => {
  const tenantFromStore = useAppSelector((state) => state.tenant.idTenant);
  const branchFromStore = useAppSelector((state) => state.branch.idBranch);

  const idTenant = options?.idTenant ?? tenantFromStore;
  const idBranch = options?.idBranch ?? branchFromStore;
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !idTenant || !idBranch) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clients = await fetchClients(idTenant, idBranch);
      setData(clients);
    } catch (e: unknown) {
      setData([]);
      setError(e instanceof Error ? e.message : "Não foi possível buscar clientes.");
    } finally {
      setLoading(false);
    }
  }, [enabled, idBranch, idTenant]);

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
