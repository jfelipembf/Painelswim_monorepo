import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchAcquirers } from "../../modules/acquirers";
import type { Acquirer } from "../../modules/acquirers";

type Result = {
  data: Acquirer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useAcquirers = (): Result => {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);

  const [data, setData] = useState<Acquirer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await fetchAcquirers(idTenant, idBranch);
      setData(list);
    } catch (e: unknown) {
      setData([]);
      setError(e instanceof Error ? e.message : "Não foi possível buscar adquirentes.");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};
