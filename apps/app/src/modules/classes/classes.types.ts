export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ClassStatus = "active" | "inactive";

export type ClassDoc = {
  id: string;
  idTenant: string;
  idBranch: string;
  idActivity: string;
  idArea: string;
  idEmployee: string;
  weekday: Weekday;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxCapacity: number;
  enrolledCount?: number;
  status: ClassStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ClassPayload = Omit<ClassDoc, "id" | "createdAt" | "updatedAt">;

export type ClassSessionStatus = "scheduled" | "canceled" | "done";

export type ClassSessionDoc = {
  id: string;
  idTenant: string;
  idBranch: string;
  idClass: string;
  idActivity: string;
  idArea: string;
  idEmployee: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxCapacity: number;
  enrolledCount?: number;
  status: ClassSessionStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type GenerateSessionsParams = {
  idTenant: string;
  idBranch: string;
  startDate: string;
  endDate: string;
};
