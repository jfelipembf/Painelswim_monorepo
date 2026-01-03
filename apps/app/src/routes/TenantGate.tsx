import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "../redux/hooks";
import { setTenantSlug } from "../redux/slices/tenantSlice";
import { normalizeTenantSlug, resolveTenantSlugFromLocation } from "utils/tenantResolver";
import { getBranchSlugFromPath } from "utils/branchResolver";

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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    
    // Verificar se a URL é do padrão /{tenantSlug}/{branchSlug}
    const match = pathname.match(/^\/([^/]+)\/([^/]+)$/);
    
    if (match) {
      const [, possibleTenant, possibleBranch] = match;
      
      // Verificar se não é uma rota reservada (ex: /dashboards/operational)
      const reservedPrefixes = ['dashboards', 'pages', 'authentication', 'applications', 'ecommerce', 'login'];
      if (!reservedPrefixes.includes(possibleTenant)) {
        // Salvar o tenant slug
        const normalized = normalizeTenantSlug(possibleTenant);
        writeStoredSlug(normalized);
        dispatch(setTenantSlug(normalized));
        
        // Redirecionar para o dashboard
        navigate('/dashboards/operational', { replace: true });
        return;
      }
    }
    
    const fromUrl = resolveTenantSlugFromLocation(window.location);
    const storedSlug = readStoredSlug();
    const defaultSlug = process.env.REACT_APP_DEFAULT_TENANT_SLUG || null;
    
    // IMPORTANTE: Ignorar fallback se for 'app' ou 'admin' (subdomínios reservados)
    const validStoredSlug = (storedSlug === 'app' || storedSlug === 'admin') ? null : storedSlug;
    const fallback = validStoredSlug || defaultSlug;
    
    const resolved = fromUrl || fallback;

    if (!resolved) {
      return;
    }

    const normalized = normalizeTenantSlug(resolved);
    
    // Só salvar no localStorage se vier da URL e não for reservado
    if (fromUrl && normalized !== 'app' && normalized !== 'admin') {
      writeStoredSlug(normalized);
    }
    dispatch(setTenantSlug(normalized));
  }, [dispatch, navigate, location]);

  return children;
};

export default TenantGate;
