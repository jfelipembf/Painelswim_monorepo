import { useCallback } from "react";

import { getFirebaseBackend } from "../../helpers/firebase_helper";
import { getBranchById, updateBranch } from "../../modules/tenants";

export const useTenantBranches = () => {
  const guardBackend = useCallback(() => {
    const backend = getFirebaseBackend();
    if (!backend) {
      throw new Error("Firebase não inicializado. Verifique REACT_APP_DEFAULTAUTH.");
    }
    return backend;
  }, []);

  const loadBranchById = useCallback(async ({ branchId, tenantId } = {}) => {
    return getBranchById({ branchId, tenantId });
  }, []);

  const saveBranch = useCallback(async ({ tenantId, branchId, updates }) => {
    const backend = guardBackend();

    let logoUrl = updates.logoUrl || "";
    if (updates.logoFile) {
      const path = `tenants/${tenantId}/branches/${branchId}/logo/${Date.now()}-${updates.logoFile.name}`;
      const upload = await backend.uploadFile({
        path,
        file: updates.logoFile,
        contentType: updates.logoFile.type,
      });
      logoUrl = upload?.url || "";
    }

    const payload = {
      ...updates,
      ...(updates.logoFile ? { logoUrl } : {}),
    };

    delete payload.logoFile;

    await updateBranch(tenantId, branchId, payload);
    return true;
  }, [guardBackend]);

  return {
    getBranchById: loadBranchById,
    updateBranch: saveBranch,
  };
};

export default useTenantBranches;
