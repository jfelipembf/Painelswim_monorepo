import type { RolePermissions } from "../modules/roles/roles.types";
import { fetchRoleById } from "../modules/roles/roles.db";
import {
  fetchCollaboratorByAuthUid,
  fetchCollaboratorByEmail,
} from "../modules/collaborators/collaborators.db";
import { fetchMember } from "./members";

export type PermissionsResult = {
  permissions: RolePermissions;
  allowAll: boolean;
  roleId?: string | null;
};

const OWNER_ROLES = new Set(["owner", "manager"]);

export const fetchUserPermissions = async (
  idTenant: string,
  idBranch: string,
  uid: string,
  email?: string | null
): Promise<PermissionsResult> => {
  if (!idTenant || !idBranch || !uid) {
    return { permissions: {}, allowAll: false, roleId: null };
  }

  const member = await fetchMember(idTenant, uid);
  const memberRole = member?.role ? String(member.role) : "";

  if (OWNER_ROLES.has(memberRole)) {
    return { permissions: {}, allowAll: true, roleId: null };
  }

  // Preferred path: resolve role directly from member doc (uid-keyed), which is compatible with rules.
  const memberRoleByBranch = (member as any)?.roleByBranch as Record<string, string> | undefined;
  if (memberRoleByBranch && Object.keys(memberRoleByBranch).length > 0) {
    const directRoleId = memberRoleByBranch[idBranch] || Object.values(memberRoleByBranch)[0];
    const roleBranchId = memberRoleByBranch[idBranch]
      ? idBranch
      : (Object.keys(memberRoleByBranch)[0] as string | undefined);

    if (directRoleId) {
      const targetBranch = roleBranchId || idBranch;
      const role = await fetchRoleById(idTenant, targetBranch, directRoleId);
      return {
        permissions: role?.permissions ?? {},
        allowAll: false,
        roleId: directRoleId,
      };
    }
  }

  let collaborator = await fetchCollaboratorByAuthUid(idTenant, uid);
  if (!collaborator && email) {
    collaborator = await fetchCollaboratorByEmail(idTenant, email);
  }
  let roleId: string | undefined;
  let roleBranchId: string | null = null;
  if (collaborator?.roleByBranch) {
    roleId = collaborator.roleByBranch[idBranch];
    roleBranchId = roleId ? idBranch : null;

    if (!roleId) {
      const [firstBranchId, firstRoleId] = Object.entries(collaborator.roleByBranch)[0] || [];
      roleId = firstRoleId;
      roleBranchId = firstBranchId ?? null;
    }
  }

  if (!roleId) {
    return { permissions: {}, allowAll: false, roleId: null };
  }

  const targetBranch = roleBranchId || idBranch;
  const role = await fetchRoleById(idTenant, targetBranch, roleId);
  return {
    permissions: role?.permissions ?? {},
    allowAll: false,
    roleId,
  };
};
