import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchClientReceivables } from "../../modules/receivables";
import type { Receivable, ReceivableStatus } from "../../modules/receivables";

type Options = {
  statuses?: ReceivableStatus[];
  enabled?: boolean;
};

type Result = {
  data: Receivable[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalOpenCents: number;
};

export const useClientReceivables = (clientId?: string | null, options?: Options): Result => {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<Receivable[]>([]);
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
      const result = await fetchClientReceivables(idTenant, idBranch, clientId, options?.statuses);
      setData(result);
    } catch (e: unknown) {
      setData([]);
      setError(e instanceof Error ? e.message : "Não foi possível buscar recebíveis do cliente.");
    } finally {
      setLoading(false);
    }
  }, [clientId, enabled, idBranch, idTenant, options?.statuses]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const totalOpenCents = useMemo(() => {
    return data.reduce((acc, r) => {
      const open = Math.max(0, Number(r.amountCents || 0) - Number(r.amountPaidCents || 0));
      return acc + open;
    }, 0);
  }, [data]);

  return { data, loading, error, refetch, totalOpenCents };
};
