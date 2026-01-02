import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchClientMemberships } from "../../modules/memberships";
import type { Membership } from "../../modules/memberships";

type Result = {
  data: Membership[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useClientMemberships = (clientId?: string | null): Result => {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);

  const [data, setData] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch || !clientId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchClientMemberships(idTenant, idBranch, clientId);
      setData(result);
    } catch (e: unknown) {
      setData([]);
      setError(e instanceof Error ? e.message : "Não foi possível buscar matrículas.");
    } finally {
      setLoading(false);
    }
  }, [clientId, idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};
