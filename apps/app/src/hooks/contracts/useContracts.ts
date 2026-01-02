import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchContracts } from "../../modules/contracts";
import type { Contract } from "../../modules/contracts";

type Options = {
  idBranch?: string | null;
  activeOnly?: boolean;
  enabled?: boolean;
};

type Result = {
  data: Contract[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useContracts = (options?: Options): Result => {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranchFromStore = useAppSelector((state) => state.branch.idBranch);

  const enabled = options?.enabled ?? true;
  const idBranch = options?.idBranch !== undefined ? options.idBranch : idBranchFromStore;
  const activeOnly = options?.activeOnly ?? true;

  const [data, setData] = useState<Contract[]>([]);
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
      const result = await fetchContracts(idTenant, idBranch, { activeOnly });
      setData(result);
    } catch (e: unknown) {
      setData([]);
      setError(e instanceof Error ? e.message : "Não foi possível buscar contratos.");
    } finally {
      setLoading(false);
    }
  }, [activeOnly, enabled, idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};
