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
    const fromUrl = resolveTenantSlugFromLocation(window.location);
    const fallback = readStoredSlug() || process.env.REACT_APP_DEFAULT_TENANT_SLUG || null;
    const resolved = fromUrl || fallback;

    if (!resolved) {
      return;
    }

    const normalized = normalizeTenantSlug(resolved);
    if (fromUrl) {
      writeStoredSlug(normalized);
    }
    dispatch(setTenantSlug(normalized));
  }, [dispatch]);

  return children;
};

export default TenantGate;
