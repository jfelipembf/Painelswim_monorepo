import { useCallback, useMemo } from "react";

import { getFirebaseBackend } from "../../helpers/firebase_helper";
import { getAuth } from "firebase/auth";

import {
  createTenant,
  listTenants,
  updateTenant,
  normalizeTenantSlug,
  normalizeCnpj,
  validateTenantPayload,
  TENANT_STATUSES,
  TENANT_STATUS_LABELS,
} from "../../modules/tenants";


export const useTenants = () => {
  const guardBackend = useCallback(() => {
    const backend = getFirebaseBackend();
    if (!backend) {
      throw new Error("Firebase não inicializado. Verifique REACT_APP_DEFAULTAUTH.");
    }
    return backend;
  }, []);

  const statusOptions = useMemo(
    () => Object.entries(TENANT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const loadTenants = useCallback(async () => {
    return listTenants();
  }, []);

  const create = useCallback(
    async (payload) => {
      const service = guardBackend();
      
      // Pegar UID do usuário autenticado
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }
      const ownerUid = currentUser.uid;

      const slug = normalizeTenantSlug(payload.slug || payload.name);
      const cnpj = normalizeCnpj(payload.cnpj);

      let logoUrl = payload.logoUrl || "";
      if (payload.logoFile) {
        const path = `tenants/${slug || "tenant"}/logo/${Date.now()}-${payload.logoFile.name}`;
        const upload = await service.uploadFile({
          path,
          file: payload.logoFile,
          contentType: payload.logoFile.type,
        });
        logoUrl = upload.url;
      }

      const responsaveis = Array.isArray(payload.responsaveis)
        ? payload.responsaveis.filter(Boolean)
        : [];

      const adminEmail = payload.adminEmail || responsaveis?.[0]?.email || "";

      const data = {
        ...payload,
        slug,
        cnpj,
        logoUrl,
        responsaveis,
        adminEmail,
      };

      const errors = validateTenantPayload(data);
      if (errors.length) throw new Error(errors[0]);

      return createTenant(data, ownerUid);
    },
    [guardBackend]
  );

  const update = useCallback(async (tenantId, updates) => {
    return updateTenant(tenantId, updates);
  }, []);

  return {
    loadTenants,
    createTenant: create,
    updateTenant: update,
    statusOptions,
    TENANT_STATUSES,
  };
};
