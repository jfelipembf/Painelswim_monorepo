import { useEffect, useMemo, useState } from "react";

import { fetchActiveEnrollmentsForClass, isEnrollmentActiveOnDate } from "modules/enrollments";
import { fetchClientById } from "modules/clients";
import { fetchAttendanceForSession, upsertAttendance } from "modules/attendance";
import { fetchMembershipById } from "modules/memberships";

import type {
  AttendanceDraft,
  StudentRow,
} from "../../layouts/pages/grade/components/ScheduleEnrollmentsDialog/types";

type Params = {
  open: boolean;
  idTenant: string;
  idBranch: string;
  idClass: string;
  sessionId: string;
  sessionDateKey: string;
  sessionStartTime?: string;
  markedByUserId?: string;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

export const useScheduleAttendanceDialog = ({
  open,
  idTenant,
  idBranch,
  idClass,
  sessionId,
  sessionDateKey,
  sessionStartTime,
  markedByUserId,
  showError,
  showSuccess,
}: Params) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [draftByClientId, setDraftByClientId] = useState<Record<string, AttendanceDraft>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!open) return;
      if (!idTenant || !idBranch || !idClass || !sessionId) {
        if (!active) return;
        setStudents([]);
        setDraftByClientId({});
        return;
      }

      setLoading(true);
      try {
        const enrollments = await fetchActiveEnrollmentsForClass(idTenant, idBranch, idClass);
        const validEnrollments = (Array.isArray(enrollments) ? enrollments : []).filter((e) =>
          sessionDateKey ? isEnrollmentActiveOnDate(e, sessionDateKey) : e.status === "active"
        );

        const clientIds = Array.from(
          new Set(validEnrollments.map((e) => String(e.clientId || "")).filter(Boolean))
        );
        const clients = await Promise.all(
          clientIds.map((cid) => fetchClientById(idTenant, idBranch, cid))
        );

        if (!active) return;

        const membershipByClientId = new Map<string, { status?: string }>();
        const normalizedClients = clients.filter(Boolean);
        const membershipFetches = normalizedClients.map(async (client: any) => {
          const activeMembershipId = String(client?.activeMembershipId || "").trim();
          if (!activeMembershipId) return;
          const membership = await fetchMembershipById(
            idTenant,
            idBranch,
            String(client.id || ""),
            activeMembershipId
          );
          if (!membership) return;
          membershipByClientId.set(String(client.id), { status: membership.status });
        });
        await Promise.all(membershipFetches);

        const resolvedFromEnrollments: StudentRow[] = normalizedClients
          .map((c: any) => ({
            id: String(c.id),
            name:
              `${String(c.firstName || "").trim()} ${String(c.lastName || "").trim()}`.trim() ||
              "Aluno",
            photoUrl: c.photoUrl || null,
            isSuspended: membershipByClientId.get(String(c.id))?.status === "paused",
            membershipStatus: membershipByClientId.get(String(c.id))?.status,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const savedAttendance = await fetchAttendanceForSession(idTenant, idBranch, sessionId);
        const attendanceEntries = Array.isArray(savedAttendance) ? savedAttendance : [];
        const savedByClientId: Record<string, AttendanceDraft> = {};
        attendanceEntries.forEach((entry: any) => {
          const cid = String(entry?.clientId || entry?.id || "").trim();
          if (!cid) return;
          savedByClientId[cid] = {
            present: String(entry?.status) !== "absent",
            justification: String(entry?.justification || ""),
          };
        });

        const extraFromHistory: StudentRow[] = attendanceEntries
          .map((entry: any) => {
            const cid = String(entry?.clientId || entry?.id || "").trim();
            if (!cid) return null;
            const name = String(entry?.studentName || "").trim() || "Aluno";
            return {
              id: cid,
              name,
              photoUrl: entry?.photoUrl ?? null,
              isSuspended: membershipByClientId.get(cid)?.status === "paused",
              membershipStatus: membershipByClientId.get(cid)?.status,
            };
          })
          .filter(Boolean) as StudentRow[];

        const byId = new Map<string, StudentRow>();
        [...resolvedFromEnrollments, ...extraFromHistory].forEach((s) => {
          if (!s?.id) return;
          if (!byId.has(s.id)) byId.set(s.id, s);
        });

        const resolved = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));

        setStudents(resolved);
        setDraftByClientId(() => {
          const next: Record<string, AttendanceDraft> = {};
          resolved.forEach((s) => {
            if (savedByClientId[s.id]) {
              next[s.id] = savedByClientId[s.id];
              return;
            }
            next[s.id] = { present: true, justification: "" };
          });
          return next;
        });
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [idBranch, idClass, idTenant, open, sessionDateKey, sessionId]);

  const handleToggleAttendance = (studentId: string) => {
    const sid = String(studentId || "").trim();
    if (!sid) return;
    const student = students.find((s) => String(s.id) === sid);
    if (student?.isSuspended) return;

    setDraftByClientId((prev) => {
      const current = prev?.[sid] || { present: true, justification: "" };
      const nextPresent = !current.present;
      return {
        ...(prev || {}),
        [sid]: {
          present: nextPresent,
          justification: nextPresent ? "" : current.justification,
        },
      };
    });
  };

  const handleJustificationChange = (clientId: string, value: string) => {
    const cid = String(clientId || "").trim();
    if (!cid) return;
    const student = students.find((s) => String(s.id) === cid);
    if (student?.isSuspended) return;
    setDraftByClientId((prev) => {
      const current = prev?.[cid] || { present: true, justification: "" };
      return {
        ...(prev || {}),
        [cid]: {
          ...current,
          justification: String(value || ""),
        },
      };
    });
  };

  const handleAddStudent = (student: any) => {
    const sid = String(student?.id || "").trim();
    if (!sid) return;
    if (!students.find((s) => s.id === sid)) {
      const nextStudent: StudentRow = {
        id: sid,
        name: String(student?.name || "Aluno"),
        photoUrl: student?.photoUrl || null,
      };
      setStudents((prev) => [...prev, nextStudent]);
      setDraftByClientId((prev) => ({
        ...(prev || {}),
        [sid]: { present: true, justification: "" },
      }));
    }
  };

  const searchOptions = useMemo(() => {
    return students.map((s) => ({ id: s.id, name: s.name, photoUrl: s.photoUrl }));
  }, [students]);

  const handleSaveAttendance = async () => {
    if (!idTenant || !idBranch || !sessionId || !idClass) {
      showError("Sessão não identificada.");
      return;
    }

    const draft = draftByClientId || {};
    for (const s of students) {
      if (s.isSuspended) continue;
      const row = draft[String(s.id)] || { present: true, justification: "" };
      if (!row.present && !String(row.justification || "").trim()) {
        showError(`Informe a justificativa da falta de ${s.name}.`);
        return;
      }
    }

    setSavingAttendance(true);
    try {
      for (const s of students) {
        if (s.isSuspended) continue;
        const row = draft[String(s.id)] || { present: true, justification: "" };
        await upsertAttendance({
          idTenant,
          idBranch,
          sessionId,
          idClass,
          sessionDateKey,
          sessionStartTime,
          clientId: String(s.id),
          status: row.present ? "present" : "absent",
          justification: row.present ? undefined : String(row.justification || "").trim(),
          studentName: s.name,
          photoUrl: s.photoUrl ?? null,
          markedByUserId,
        });
      }
      showSuccess("Presenças salvas!");
    } catch (e: any) {
      showError(e?.message || "Erro ao salvar presenças");
    } finally {
      setSavingAttendance(false);
    }
  };

  return {
    loading,
    students,
    draftByClientId,
    savingAttendance,
    searchOptions,
    handleToggleAttendance,
    handleJustificationChange,
    handleAddStudent,
    handleSaveAttendance,
  };
};
