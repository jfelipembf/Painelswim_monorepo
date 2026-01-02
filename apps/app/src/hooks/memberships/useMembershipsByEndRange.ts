import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchMembershipsByEndRange } from "../../modules/memberships";
import type { Membership } from "../../modules/memberships";

type Options = {
  idTenant?: string;
  idBranch?: string | null;
  startDateKey?: string;
  endDateKey?: string;
  enabled?: boolean;
};

type Result = {
  data: Membership[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useMembershipsByEndRange = (options?: Options): Result => {
  const tenantFromStore = useAppSelector((state) => state.tenant.idTenant);
  const branchFromStore = useAppSelector((state) => state.branch.idBranch);

  const idTenant = options?.idTenant ?? tenantFromStore;
  const idBranch = options?.idBranch !== undefined ? options.idBranch : branchFromStore;
  const startDateKey = options?.startDateKey ?? "";
  const endDateKey = options?.endDateKey ?? "";
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !idTenant || !idBranch || !startDateKey || !endDateKey) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMembershipsByEndRange(idTenant, idBranch, startDateKey, endDateKey);
      setData(result);
    } catch (e: unknown) {
      setData([]);
      setError(e instanceof Error ? e.message : "Não foi possível buscar matrículas.");
    } finally {
      setLoading(false);
    }
  }, [enabled, endDateKey, idBranch, idTenant, startDateKey]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};
