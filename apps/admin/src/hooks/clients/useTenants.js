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

      const auth = getAuth();
      const currentUser = auth.currentUser;
      const createdByEmail = currentUser?.email || "";

      const ownerFullName = (payload.ownerName || responsaveis?.[0]?.name || "").trim();
      const ownerPassword = payload.ownerPassword || "";
      const nameParts = ownerFullName ? ownerFullName.split(/\s+/) : [];
      const firstName = payload.ownerFirstName || nameParts[0] || "";
      const lastName = payload.ownerLastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

      const data = {
        ...payload,
        slug,
        cnpj,
        logoUrl,
        responsaveis,
        adminEmail,
        createdByEmail,
      };

      const errors = validateTenantPayload(data);
      if (errors.length) throw new Error(errors[0]);

      const ownerData = {
        email: adminEmail,
        password: ownerPassword,
        firstName,
        lastName,
      };

      return createTenant(data, ownerData);
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
