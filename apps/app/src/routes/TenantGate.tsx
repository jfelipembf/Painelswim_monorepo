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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("[TenantGate] Resolvendo tenant slug...");
    console.log("[TenantGate] location:", {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
    });
    
    // Verificar se a URL é do padrão /{tenantSlug}/{branchSlug}
    const pathname = location.pathname;
    const match = pathname.match(/^\/([^/]+)\/([^/]+)$/);
    
    if (match) {
      const [, possibleTenant, possibleBranch] = match;
      console.log("[TenantGate] Detectado padrão /{tenant}/{branch}:", { possibleTenant, possibleBranch });
      
      // Verificar se não é uma rota reservada (ex: /dashboards/operational)
      const reservedPrefixes = ['dashboards', 'pages', 'authentication', 'applications', 'ecommerce', 'login'];
      if (!reservedPrefixes.includes(possibleTenant)) {
        console.log("[TenantGate] ✅ Padrão válido detectado, salvando tenant e redirecionando...");
        
        // Salvar o tenant slug
        const normalized = normalizeTenantSlug(possibleTenant);
        const currentStored = readStoredSlug();
        
        // Só redirecionar se ainda não redirecionamos (evitar loop)
        if (currentStored !== normalized) {
          writeStoredSlug(normalized);
          dispatch(setTenantSlug(normalized));
          
          // Redirecionar para o dashboard
          console.log("[TenantGate] Redirecionando para /dashboards/operational");
          navigate('/dashboards/operational', { replace: true });
          return;
        } else {
          console.log("[TenantGate] Tenant já salvo, pulando redirect para evitar loop");
        }
      }
    }
    
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
  }, [dispatch, navigate, location]);

  return children;
};

export default TenantGate;
