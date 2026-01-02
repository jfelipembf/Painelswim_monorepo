import type {
  Collaborator,
  CollaboratorAddress,
  CollaboratorPayload,
  CollaboratorUpdatePayload,
} from "./collaborators.types";

type CollaboratorDocData = Omit<Collaborator, "id"> & {
  idTenant?: string;
  idBranch?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const emptyAddress = (): CollaboratorAddress => ({
  zip: "",
  state: "",
  city: "",
  neighborhood: "",
  addressLine: "",
  street: "",
  number: "",
});

export const normalizeCollaboratorPayload = (
  payload: CollaboratorPayload
): CollaboratorPayload => ({
  ...payload,
  name: String(payload.name || "").trim(),
  lastName: String(payload.lastName || "").trim(),
  email: String(payload.email || "").trim(),
  photoUrl: payload.photoUrl !== undefined ? String(payload.photoUrl || "").trim() : undefined,
  phone: String(payload.phone || "").trim(),
  gender: String(payload.gender || "").trim(),
  birthDate: String(payload.birthDate || "").slice(0, 10),
  cpf: String(payload.cpf || "").trim(),
  hireDate: String(payload.hireDate || "").slice(0, 10),
  salary: String(payload.salary || "").trim(),
  council: String(payload.council || "").trim(),
  branchIds: Array.isArray(payload.branchIds) ? payload.branchIds : [],
  roleByBranch: payload.roleByBranch || {},
  address: payload.address ? { ...payload.address } : emptyAddress(),
  authUid: payload.authUid ? String(payload.authUid).trim() : undefined,
});

export const normalizeCollaboratorUpdatePayload = (
  payload: CollaboratorUpdatePayload
): CollaboratorUpdatePayload => ({
  ...payload,
  name: payload.name !== undefined ? String(payload.name || "").trim() : undefined,
  lastName: payload.lastName !== undefined ? String(payload.lastName || "").trim() : undefined,
  email: payload.email !== undefined ? String(payload.email || "").trim() : undefined,
  photoUrl: payload.photoUrl !== undefined ? String(payload.photoUrl || "").trim() : undefined,
  phone: payload.phone !== undefined ? String(payload.phone || "").trim() : undefined,
  gender: payload.gender !== undefined ? String(payload.gender || "").trim() : undefined,
  birthDate:
    payload.birthDate !== undefined ? String(payload.birthDate || "").slice(0, 10) : undefined,
  cpf: payload.cpf !== undefined ? String(payload.cpf || "").trim() : undefined,
  hireDate:
    payload.hireDate !== undefined ? String(payload.hireDate || "").slice(0, 10) : undefined,
  salary: payload.salary !== undefined ? String(payload.salary || "").trim() : undefined,
  council: payload.council !== undefined ? String(payload.council || "").trim() : undefined,
  address: payload.address ? { ...payload.address } : undefined,
});

export const mapCollaboratorDoc = (
  idTenant: string,
  idBranch: string,
  id: string,
  raw: CollaboratorDocData
): Collaborator => ({
  id,
  idTenant: raw.idTenant || idTenant,
  idBranch: raw.idBranch || idBranch,
  name: String(raw.name || ""),
  lastName: String(raw.lastName || ""),
  email: String(raw.email || ""),
  photoUrl: raw.photoUrl,
  phone: String(raw.phone || ""),
  gender: String(raw.gender || ""),
  birthDate: String(raw.birthDate || "").slice(0, 10),
  cpf: String(raw.cpf || ""),
  hireDate: String(raw.hireDate || "").slice(0, 10),
  salary: String(raw.salary || ""),
  council: String(raw.council || ""),
  status: raw.status,
  branchIds: Array.isArray(raw.branchIds) ? raw.branchIds : [],
  roleByBranch: raw.roleByBranch || {},
  address: raw.address ? { ...raw.address } : emptyAddress(),
  authUid: raw.authUid,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});
