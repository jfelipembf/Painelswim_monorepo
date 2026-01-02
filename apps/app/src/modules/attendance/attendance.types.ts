export type AttendanceStatus = "present" | "absent";

export type AttendanceEntry = {
  id: string;
  idTenant: string;
  idBranch: string;
  sessionId: string;
  idClass: string;
  sessionDateKey?: string;
  sessionStartTime?: string;
  clientId: string;
  status: AttendanceStatus;
  justification?: string;
  studentName?: string;
  photoUrl?: string | null;
  markedByUserId?: string;
  markedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AttendanceUpsertPayload = {
  idTenant: string;
  idBranch: string;
  sessionId: string;
  idClass: string;
  sessionDateKey?: string;
  sessionStartTime?: string;
  clientId: string;
  status: AttendanceStatus;
  justification?: string;
  studentName?: string;
  photoUrl?: string | null;
  markedByUserId?: string;
};
