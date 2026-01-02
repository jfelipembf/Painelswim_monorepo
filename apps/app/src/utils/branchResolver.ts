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
  console.log("[branchResolver] pathname:", pathname);
  
  // Format: /{tenantSlug}/{branchSlug}/...
  const match = pathname.match(/^\/([^/]+)\/([^/]+)/);
  if (!match) {
    console.log("[branchResolver] ❌ Nenhum match para padrão /{tenant}/{branch}");
    return null;
  }

  const firstSegment = match[1];
  const secondSegment = match[2];
  
  console.log("[branchResolver] Primeiro segmento:", firstSegment);
  console.log("[branchResolver] Segundo segmento:", secondSegment);

  // Se o primeiro segmento for reservado, não é tenant/branch
  if (RESERVED_PATH_PREFIXES.has(firstSegment)) {
    console.log("[branchResolver] ❌ Primeiro segmento é reservado");
    return null;
  }

  // O segundo segmento é o branch slug
  console.log("[branchResolver] ✅ Branch slug resolvido:", secondSegment);
  return secondSegment || null;
};

export const normalizeBranchSlug = (slug: string): string => slug.trim().toLowerCase();
