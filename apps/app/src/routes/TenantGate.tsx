import { useEffect } from "react";
import { useAppDispatch } from "../redux/hooks";
import { setTenantSlug } from "../redux/slices/tenantSlice";
import { normalizeTenantSlug, resolveTenantSlugFromLocation } from "utils/tenantResolver";

type TenantGateProps = {
  children: JSX.Element;
};

const STORAGE_KEY = "activeTenantSlug";

const readStoredSlug = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStoredSlug = (slug: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // Ignore storage errors (private mode, blocked storage, etc).
  }
};

const TenantGate = ({ children }: TenantGateProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log("[TenantGate] Resolvendo tenant slug...");
    console.log("[TenantGate] location:", {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
    });
    
    const fromUrl = resolveTenantSlugFromLocation(window.location);
    console.log("[TenantGate] Tenant slug da URL:", fromUrl);
    
    const fallback = readStoredSlug() || process.env.REACT_APP_DEFAULT_TENANT_SLUG || null;
    console.log("[TenantGate] Fallback:", fallback);
    
    const resolved = fromUrl || fallback;
    console.log("[TenantGate] Tenant slug resolvido:", resolved);

    if (!resolved) {
      console.log("[TenantGate] ❌ Nenhum tenant slug resolvido");
      return;
    }

    const normalized = normalizeTenantSlug(resolved);
    console.log("[TenantGate] ✅ Tenant slug normalizado:", normalized);
    
    if (fromUrl) {
      writeStoredSlug(normalized);
    }
    dispatch(setTenantSlug(normalized));
  }, [dispatch]);

  return children;
};

export default TenantGate;
