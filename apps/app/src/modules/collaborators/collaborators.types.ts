export const COLLABORATOR_ROLES = {
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  COORDINATOR: "coordinator",
  STAFF: "staff",
};

export const COLLABORATOR_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PAUSED: "paused",
};

export interface CollaboratorListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
}

export const COLLABORATOR_FORM_FIELDS = {
  name: { label: "Nome Completo", required: true, type: "text" },
  email: { label: "Email", required: true, type: "email" },
  phone: { label: "Telefone", required: false, type: "tel" },
  role: { label: "Função", required: true, type: "select" },
  status: { label: "Status", required: true, type: "select" },
};

export type CollaboratorAddress = {
  zip: string;
  state: string;
  city: string;
  neighborhood: string;
  addressLine: string;
  street: string;
  number: string;
};

export type CollaboratorStatus = "active" | "inactive" | "paused";

export type CollaboratorPayload = {
  name: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  phone: string;
  gender: string;
  birthDate: string;
  cpf: string;
  hireDate: string;
  salary: string;
  council: string;
  status: CollaboratorStatus;
  branchIds: string[];
  roleByBranch: Record<string, string>;
  address: CollaboratorAddress;
  authUid?: string;
};

export type Collaborator = CollaboratorPayload & {
  id: string;
  idTenant: string;
  idBranch: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CollaboratorUpdatePayload = Partial<
  Omit<CollaboratorPayload, "status" | "branchIds" | "roleByBranch" | "authUid">
> & {
  address?: CollaboratorAddress;
};
