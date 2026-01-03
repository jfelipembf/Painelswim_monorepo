const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const RESERVED_PATH_PREFIXES = new Set([
  "t",
  "login",
  "forgot-password",
  "dashboards",
  "grade",
  "collaborators",
  "clients",
  "members",
  "admin",
  "financial",
  "crm",
  "touch",
  "sales",
  "management",
]);

const RESERVED_SUBDOMAINS = new Set(["app", "admin"]);

const getTenantSlugFromPath = (pathname: string): string | null => {
  const match = pathname.match(/^\/t\/([^/]+)/);
  return match ? match[1] : null;
};

const getTenantSlugFromRootPath = (pathname: string): string | null => {
  const match = pathname.match(/^\/([^/]+)/);
  const candidate = match?.[1];
  if (!candidate || RESERVED_PATH_PREFIXES.has(candidate)) {
    return null;
  }
  return candidate;
};

const getTenantSlugFromQuery = (search: string): string | null => {
  const params = new URLSearchParams(search);
  return params.get("tenant");
};

export const getTenantSlugFromUrl = (): string | null => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  console.log("[tenantResolver] hostname:", hostname);
  console.log("[tenantResolver] pathname:", pathname);

  // Ignorar subdomínios reservados
  if (RESERVED_SUBDOMAINS.has(hostname.split(".")[0])) {
    console.log("[tenantResolver] Subdomínio reservado detectado, tentando path");
    // Tentar pegar do primeiro segmento do path
    const match = pathname.match(/^\/([^/]+)/);
    if (match) {
      const firstSegment = match[1];
      console.log("[tenantResolver] Primeiro segmento do path:", firstSegment);
      if (!RESERVED_PATH_PREFIXES.has(firstSegment)) {
        console.log("[tenantResolver] Tenant slug resolvido do path:", firstSegment);
        return firstSegment;
      }
      console.log("[tenantResolver] Primeiro segmento é reservado");
    }
    console.log("[tenantResolver] Nenhum tenant slug encontrado no path");
    return null;
  }

  // Subdomínio customizado (ex: academia.painelswim.com)
  const subdomain = hostname.split(".")[0];
  console.log("[tenantResolver] Subdomínio customizado:", subdomain);
  if (subdomain && subdomain !== "www") {
    console.log("[tenantResolver] Tenant slug resolvido do subdomínio:", subdomain);
    return subdomain;
  }

  console.log("[tenantResolver] Nenhum tenant slug encontrado");
  return null;
};

export const getTenantSlugFromHostname = (hostname: string): string | null => {
  if (!hostname) {
    return null;
  }

  if (LOCAL_HOSTNAMES.has(hostname)) {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length < 3) {
    return null;
  }

  const candidate = parts[0];
  if (!candidate || candidate === "www") {
    return null;
  }

  if (candidate === "app" || candidate === "admin") {
    return null;
  }

  return candidate;
};

export const resolveTenantSlugFromLocation = (location: Location): string | null => {
  console.log("[resolveTenantSlugFromLocation] Iniciando resolução...");
  
  const fromPath = getTenantSlugFromPath(location.pathname);
  console.log("[resolveTenantSlugFromLocation] getTenantSlugFromPath:", fromPath);
  if (fromPath) {
    console.log("[resolveTenantSlugFromLocation] ✅ Resolvido via /t/ path:", fromPath);
    return fromPath;
  }

  const fromRootPath = getTenantSlugFromRootPath(location.pathname);
  console.log("[resolveTenantSlugFromLocation] getTenantSlugFromRootPath:", fromRootPath);
  if (fromRootPath) {
    console.log("[resolveTenantSlugFromLocation] ✅ Resolvido via root path:", fromRootPath);
    return fromRootPath;
  }

  const fromQuery = getTenantSlugFromQuery(location.search);
  console.log("[resolveTenantSlugFromLocation] getTenantSlugFromQuery:", fromQuery);
  if (fromQuery) {
    console.log("[resolveTenantSlugFromLocation] ✅ Resolvido via query:", fromQuery);
    return fromQuery;
  }

  const fromHostname = getTenantSlugFromHostname(location.hostname);
  console.log("[resolveTenantSlugFromLocation] getTenantSlugFromHostname:", fromHostname);
  if (fromHostname) {
    console.log("[resolveTenantSlugFromLocation] ✅ Resolvido via hostname:", fromHostname);
  } else {
    console.log("[resolveTenantSlugFromLocation] ❌ Nenhum tenant slug encontrado");
  }
  
  return fromHostname;
};

export const normalizeTenantSlug = (slug: string): string => slug.trim().toLowerCase();
