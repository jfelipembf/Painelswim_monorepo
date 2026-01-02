import { useCallback, useMemo } from "react";

import {
  createBranch,
  getBranchById,
  listBranches,
  updateBranch,
  BRANCH_STATUS_LABELS,
  validateBranchPayload,
} from "../../modules/branches";

export const useBranches = () => {
  const statusOptions = useMemo(
    () => Object.entries(BRANCH_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const loadBranches = useCallback(async ({ tenantId } = {}) => {
    return listBranches({ tenantId });
  }, []);

  const getById = useCallback(async (branchId) => {
    return getBranchById(branchId);
  }, []);

  const create = useCallback(async (payload) => {
    const errors = validateBranchPayload(payload);
    if (errors.length) throw new Error(errors[0]);
    return createBranch(payload);
  }, []);

  const update = useCallback(async (branchId, updates) => {
    return updateBranch(branchId, updates);
  }, []);

  return {
    loadBranches,
    getBranchById: getById,
    createBranch: create,
    updateBranch: update,
    statusOptions,
  };
};
