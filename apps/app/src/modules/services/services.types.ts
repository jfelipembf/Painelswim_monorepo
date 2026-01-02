export type Service = {
  id: string;
  idTenant: string;
  idBranch: string;
  name: string;
  description?: string;
  priceCents: number;
  durationMinutes: number;
  inactive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ServicePayload = {
  name: string;
  description?: string;
  priceCents: number;
  durationMinutes: number;
  inactive: boolean;
};
