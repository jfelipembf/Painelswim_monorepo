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
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log("[TenantGate] localStorage tenant slug:", stored);
    return stored;
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
    
    const storedSlug = readStoredSlug();
    const defaultSlug = process.env.REACT_APP_DEFAULT_TENANT_SLUG || null;
    
    // IMPORTANTE: Ignorar fallback se for 'app' ou 'admin' (subdomínios reservados)
    const validStoredSlug = (storedSlug === 'app' || storedSlug === 'admin') ? null : storedSlug;
    const fallback = validStoredSlug || defaultSlug;
    
    console.log("[TenantGate] Fallback original:", storedSlug);
    console.log("[TenantGate] Fallback válido:", fallback);
    
    const resolved = fromUrl || fallback;
    console.log("[TenantGate] Tenant slug resolvido:", resolved);

    if (!resolved) {
      console.log("[TenantGate] ❌ Nenhum tenant slug resolvido");
      return;
    }

    const normalized = normalizeTenantSlug(resolved);
    console.log("[TenantGate] ✅ Tenant slug normalizado:", normalized);
    
    // Só salvar no localStorage se vier da URL e não for reservado
    if (fromUrl && normalized !== 'app' && normalized !== 'admin') {
      writeStoredSlug(normalized);
    }
    dispatch(setTenantSlug(normalized));
  }, [dispatch]);

  return children;
};

export default TenantGate;
