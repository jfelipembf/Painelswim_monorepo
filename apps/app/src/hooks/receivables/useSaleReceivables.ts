import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchSaleReceivables } from "../../modules/receivables";
import type { Receivable } from "../../modules/receivables";

type Result = {
  data: Receivable[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useSaleReceivables = (saleId?: string | null): Result => {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);

  const [data, setData] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch || !saleId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchSaleReceivables(idTenant, idBranch, saleId);
      setData(result);
    } catch (e: unknown) {
      setData([]);
      setError(e instanceof Error ? e.message : "Não foi possível buscar recebíveis.");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant, saleId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};
