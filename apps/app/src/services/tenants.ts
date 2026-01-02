import { doc, getDoc } from "firebase/firestore";
import type { TenantBranding } from "../redux/slices/tenantSlice";
import { getFirebaseDb } from "./firebase";

export type TenantConfig = {
  idTenant: string;
  slug: string;
  name?: string;
  branding?: TenantBranding | null;
};

export const resolveTenantBySlug = async (slug: string): Promise<TenantConfig> => {
  if (!slug) {
    throw new Error("Slug da academia é obrigatório.");
  }

  const db = getFirebaseDb();
  const lookupRef = doc(db, "tenantsBySlug", slug);
  const lookupSnap = await getDoc(lookupRef);

  if (!lookupSnap.exists()) {
    throw new Error(`Slug da academia não encontrado: ${slug}`);
  }

  const lookupData = lookupSnap.data() as { idTenant?: string };
  const idTenant = lookupData.idTenant;

  if (!idTenant) {
    throw new Error(`ID da academia não encontrado para o slug: ${slug}`);
  }

  return fetchTenantConfig(idTenant, slug);
};

export const fetchTenantConfig = async (
  idTenant: string,
  fallbackSlug?: string
): Promise<TenantConfig> => {
  if (!idTenant) {
    throw new Error("ID da academia é obrigatório.");
  }

  const db = getFirebaseDb();
  const tenantRef = doc(db, "tenants", idTenant);
  const tenantSnap = await getDoc(tenantRef);

  if (!tenantSnap.exists()) {
    throw new Error(`Academia não encontrada: ${idTenant}`);
  }

  const data = tenantSnap.data() as {
    name?: string;
    slug?: string;
    branding?: TenantBranding | null;
  };

  return {
    idTenant,
    slug: data.slug || fallbackSlug || idTenant,
    name: data.name,
    branding: data.branding ?? null,
  };
};
