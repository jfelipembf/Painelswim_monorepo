export type EnrollmentStatus = "active" | "inactive";

export type EnrollmentDoc = {
  id: string;
  idTenant: string;
  idBranch: string;
  clientId: string;
  idClass: string;
  status: EnrollmentStatus;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string; // YYYY-MM-DD
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type EnrollmentPayload = Omit<EnrollmentDoc, "id" | "createdAt" | "updatedAt">;
