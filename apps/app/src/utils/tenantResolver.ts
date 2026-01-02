const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const getTenantSlugFromPath = (pathname: string): string | null => {
  const match = pathname.match(/^\/t\/([^/]+)/);
  return match ? match[1] : null;
};

const getTenantSlugFromQuery = (search: string): string | null => {
  const params = new URLSearchParams(search);
  return params.get("tenant");
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

  return candidate;
};

export const resolveTenantSlugFromLocation = (location: Location): string | null => {
  const fromPath = getTenantSlugFromPath(location.pathname);
  if (fromPath) {
    return fromPath;
  }

  const fromQuery = getTenantSlugFromQuery(location.search);
  if (fromQuery) {
    return fromQuery;
  }

  return getTenantSlugFromHostname(location.hostname);
};

export const normalizeTenantSlug = (slug: string): string => slug.trim().toLowerCase();
