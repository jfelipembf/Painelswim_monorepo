import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchCollaborators } from "../../modules/collaborators";
import type { Collaborator } from "../../modules/collaborators";

export const useCollaborators = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant) return;

    setLoading(true);
    setError(null);

    try {
      const list = await fetchCollaborators(idTenant, idBranch);
      setCollaborators(list);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar colaboradores");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    idTenant,
    idBranch,
    collaborators,
    loading,
    error,
    refetch,
  };
};
