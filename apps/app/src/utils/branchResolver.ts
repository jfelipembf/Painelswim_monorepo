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

export const getBranchSlugFromPath = (pathname: string): string | null => {
  // Format: /{tenantSlug}/{branchSlug}/...
  const match = pathname.match(/^\/([^/]+)\/([^/]+)/);
  if (!match) {
    return null;
  }

  const firstSegment = match[1];
  const secondSegment = match[2];

  // Se o primeiro segmento for reservado, não é tenant/branch
  if (RESERVED_PATH_PREFIXES.has(firstSegment)) {
    return null;
  }

  // O segundo segmento é o branch slug
  return secondSegment || null;
};

export const normalizeBranchSlug = (slug: string): string => slug.trim().toLowerCase();
