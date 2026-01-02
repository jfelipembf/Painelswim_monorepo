import type { Role } from "./roles.types";

type RoleDocData = Omit<Role, "id"> & {
  idTenant?: string;
  idBranch?: string;
  name?: string;
  description?: string;
  permissions?: Record<string, boolean>;
};

export const mapRoleDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: RoleDocData
): Role => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: raw.idBranch || idBranch,
  name: String(raw.name || id),
  description: raw.description,
  permissions: raw.permissions ?? {},
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});
