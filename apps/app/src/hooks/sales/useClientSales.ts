import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchSalesByClient } from "../../modules/sales";
import type { Sale } from "../../modules/sales";

type Options = {
  enabled?: boolean;
};

type Result = {
  data: Sale[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useClientSales = (clientId?: string | null, options?: Options): Result => {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !idTenant || !idBranch || !clientId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchSalesByClient(idTenant, idBranch, clientId);
      setData(result);
    } catch (e: unknown) {
      setData([]);
      setError(e instanceof Error ? e.message : "Não foi possível buscar compras do cliente.");
    } finally {
      setLoading(false);
    }
  }, [clientId, enabled, idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const stable = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  return { data: stable, loading, error, refetch };
};
