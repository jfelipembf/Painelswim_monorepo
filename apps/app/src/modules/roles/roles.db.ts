import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";

import { mapRoleDoc } from "./roles.domain";

import {
  PERMISSION_GROUPS,
  type Role,
  type RolePayload,
  type RolePermissions,
} from "./roles.types";

type DefaultRoleSeed = {
  name: string;
  description: string;
  permissions: Record<string, boolean>;
};

type RoleDocData = Omit<Role, "id"> & {
  idTenant?: string;
  idBranch?: string;
  name?: string;
  description?: string;
  permissions?: Record<string, boolean>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const rolesCollection = (idTenant: string, idBranch: string) => {
  const db = getFirebaseDb();
  return collection(db, "tenants", idTenant, "branches", idBranch, "roles");
};

export const fetchRoles = async (idTenant: string, idBranch: string): Promise<Role[]> => {
  if (!idTenant || !idBranch) return [];

  const ref = rolesCollection(idTenant, idBranch);
  const snapshot = await getDocs(query(ref, orderBy("name")));

  return snapshot.docs.map((d) => mapRoleDoc(idTenant, idBranch, d.id, d.data() as RoleDocData));
};

export const fetchRoleById = async (
  idTenant: string,
  idBranch: string,
  roleId: string
): Promise<Role | null> => {
  if (!idTenant || !idBranch || !roleId) return null;

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "roles", roleId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return mapRoleDoc(idTenant, idBranch, snap.id, snap.data() as RoleDocData);
};

export const createRole = async (
  idTenant: string,
  idBranch: string,
  payload: RolePayload
): Promise<string> => {
  if (!idTenant || !idBranch) throw new Error("Tenant e unidade são obrigatórios.");

  const ref = await addDoc(rolesCollection(idTenant, idBranch), {
    idTenant,
    idBranch,
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
};

export const updateRole = async (
  idTenant: string,
  idBranch: string,
  roleId: string,
  payload: RolePayload
): Promise<void> => {
  if (!idTenant || !idBranch || !roleId) {
    throw new Error("Cargo inválido.");
  }

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "roles", roleId);
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const deleteRole = async (
  idTenant: string,
  idBranch: string,
  roleId: string
): Promise<void> => {
  if (!idTenant || !idBranch || !roleId) {
    throw new Error("Cargo inválido.");
  }

  const db = getFirebaseDb();
  const ref = doc(db, "tenants", idTenant, "branches", idBranch, "roles", roleId);
  await deleteDoc(ref);
};

const normalizeRoleNameKey = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const buildAllPermissions = (): RolePermissions => {
  const permissions: RolePermissions = {};
  PERMISSION_GROUPS.forEach((group) => {
    group.permissions.forEach((permission) => {
      permissions[permission.key] = true;
    });
  });
  return permissions;
};

const DEFAULT_ROLE_SEEDS: DefaultRoleSeed[] = [
  {
    name: "Gestor",
    description: "Acesso total ao sistema",
    permissions: buildAllPermissions(),
  },
  {
    name: "Coordenador de vendas",
    description: "Acesso comercial e CRM",
    permissions: {
      dashboards_commercial_view: true,
      crm_view: true,
      sales_purchase: true,
      members_manage: true,
    },
  },
  {
    name: "Recepcionista",
    description: "Rotinas de atendimento e caixa",
    permissions: {
      grade_manage: true,
      members_manage: true,
      financial_cashier: true,
      crm_view: true,
    },
  },
  {
    name: "Professor",
    description: "Acesso à grade e alunos",
    permissions: {
      grade_manage: true,
      members_manage: true,
    },
  },
  {
    name: "Coordenador",
    description: "Acesso à operação e gestão de turmas",
    permissions: {
      dashboards_management_view: true,
      grade_manage: true,
      members_manage: true,
      collaborators_manage: true,
      admin_schedules: true,
      admin_areas: true,
      management_event_plan: true,
      management_tests: true,
      management_evaluation_levels: true,
    },
  },
];

export const ensureDefaultRoles = async (idTenant: string, idBranch: string): Promise<void> => {
  if (!idTenant || !idBranch) return;

  const existing = await fetchRoles(idTenant, idBranch);
  const existingKeys = new Set(existing.map((r) => normalizeRoleNameKey(r.name)));

  for (const seed of DEFAULT_ROLE_SEEDS) {
    const key = normalizeRoleNameKey(seed.name);
    if (!key || existingKeys.has(key)) continue;

    const payload: RolePayload = {
      name: seed.name,
      description: seed.description,
      permissions: seed.permissions,
    };

    await createRole(idTenant, idBranch, payload);
    existingKeys.add(key);
  }
};
