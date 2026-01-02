import type {
  AttendanceEntry,
  AttendanceStatus,
  AttendanceUpsertPayload,
} from "./attendance.types";

export const normalizeAttendanceStatus = (value: any): AttendanceStatus => {
  return value === "absent" ? "absent" : "present";
};

export const normalizeAttendancePayload = (
  payload: AttendanceUpsertPayload
): AttendanceUpsertPayload => {
  const sessionDateKey = String(payload.sessionDateKey || "").slice(0, 10);
  const sessionStartTime = String(payload.sessionStartTime || "").trim();

  return {
    ...payload,
    idTenant: String(payload.idTenant || "").trim(),
    idBranch: String(payload.idBranch || "").trim(),
    sessionId: String(payload.sessionId || "").trim(),
    idClass: String(payload.idClass || "").trim(),
    sessionDateKey: sessionDateKey || undefined,
    sessionStartTime: sessionStartTime || undefined,
    clientId: String(payload.clientId || "").trim(),
    status: normalizeAttendanceStatus(payload.status),
    justification:
      payload.justification !== undefined ? String(payload.justification).trim() : undefined,
    studentName: payload.studentName ? String(payload.studentName).trim() : undefined,
    photoUrl: payload.photoUrl ?? undefined,
    markedByUserId: payload.markedByUserId ? String(payload.markedByUserId).trim() : undefined,
  };
};

export const mapAttendanceDoc = (
  id: string,
  data: any,
  fallback: Pick<AttendanceEntry, "idTenant" | "idBranch" | "sessionId" | "idClass" | "clientId">
): AttendanceEntry => {
  return {
    id,
    idTenant: String(data?.idTenant || fallback.idTenant),
    idBranch: String(data?.idBranch || fallback.idBranch),
    sessionId: String(data?.sessionId || fallback.sessionId),
    idClass: String(data?.idClass || fallback.idClass),
    sessionDateKey: data?.sessionDateKey ? String(data.sessionDateKey) : undefined,
    sessionStartTime: data?.sessionStartTime ? String(data.sessionStartTime) : undefined,
    clientId: String(data?.clientId || fallback.clientId),
    status: normalizeAttendanceStatus(data?.status),
    justification: data?.justification ? String(data.justification) : undefined,
    studentName: data?.studentName ? String(data.studentName) : undefined,
    photoUrl: data?.photoUrl ?? undefined,
    markedByUserId: data?.markedByUserId ? String(data.markedByUserId) : undefined,
    markedAt: data?.markedAt,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  };
};
