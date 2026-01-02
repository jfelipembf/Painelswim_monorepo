import { useCallback, useEffect, useMemo, useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";

import { useAppSelector } from "../../redux/hooks";

import {
  createClass,
  deleteBranchSessionsForClassInRange,
  deleteClass as deleteClassDb,
  fetchBranchSessionsInRange,
  fetchClasses,
  normalizeWeekday,
  updateClass as updateClassDb,
  validateClassPayload,
} from "../../modules/classes";

import { toDateKey } from "../../modules/enrollments";

import type { ScheduleFormValues } from "../../layouts/pages/admin/schedules/types";
import type {
  ClassDoc,
  ClassSessionDoc,
  ClassPayload,
  GenerateSessionsParams,
} from "../../modules/classes";

export const useClasses = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [sessions, setSessions] = useState<ClassSessionDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingSessions, setGeneratingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUse = Boolean(idTenant && idBranch);

  const refetchClasses = useCallback(async () => {
    if (!idTenant || !idBranch) return;
    const list = await fetchClasses(idTenant, idBranch);
    setClasses(list);
  }, [idTenant, idBranch]);

  const refetchSessions = useCallback(
    async (startDate: string, endDate: string) => {
      if (!idTenant || !idBranch) return [];
      const list = await fetchBranchSessionsInRange(idTenant, idBranch, startDate, endDate);
      setSessions(list);
      return list;
    },
    [idTenant, idBranch]
  );

  const updateFromScheduleForm = useCallback(
    async (
      idClass: string,
      values: ScheduleFormValues,
      effectiveFromDate?: string
    ): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade não identificados.");
      if (!idClass) throw new Error("Turma não identificada.");

      const weekdays = Array.isArray(values.weekDays) ? values.weekDays : [];
      if (weekdays.length !== 1)
        throw new Error("Para editar, selecione exatamente 1 dia da semana.");

      const payload: ClassPayload = {
        idTenant,
        idBranch,
        idActivity: String(values.idActivity || "").trim(),
        idArea: String(values.idArea || "").trim(),
        idEmployee: String(values.idEmployee || "").trim(),
        weekday: normalizeWeekday(weekdays[0]),
        startDate: String(values.startDate || "").slice(0, 10),
        endDate: values.endDate ? String(values.endDate).slice(0, 10) : undefined,
        startTime: String(values.startTime || "").trim(),
        endTime: String(values.endTime || "").trim(),
        durationMinutes: Number(values.durationMinutes || 0),
        maxCapacity: Number(values.maxCapacity || 0),
        status: "active",
      };

      const effectiveKey = effectiveFromDate ? String(effectiveFromDate).slice(0, 10) : "";
      const current = (Array.isArray(classes) ? classes : []).find(
        (c) => String(c.id) === String(idClass)
      );
      const currentStart = String(current?.startDate || "").slice(0, 10);
      const nextStart =
        effectiveKey && currentStart && effectiveKey > currentStart
          ? effectiveKey
          : payload.startDate;
      payload.startDate = nextStart;

      const errors = validateClassPayload(payload);
      if (errors.length) throw new Error(errors[0]);

      await updateClassDb(idTenant, idBranch, idClass, payload);
      await refetchClasses();

      if (effectiveKey) {
        const endKey = payload.endDate ? String(payload.endDate).slice(0, 10) : "";
        const horizonEnd =
          endKey ||
          (() => {
            const base = new Date(`${effectiveKey}T00:00:00.000Z`);
            base.setUTCDate(base.getUTCDate() + 120);
            return String(base.toISOString()).slice(0, 10);
          })();

        await deleteBranchSessionsForClassInRange(
          idTenant,
          idBranch,
          idClass,
          effectiveKey,
          horizonEnd
        );
        await refetchSessions(effectiveKey, horizonEnd);
      }
    },
    [classes, idBranch, idTenant, refetchClasses, refetchSessions]
  );

  const deleteClass = useCallback(
    async (idClass: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade não identificados.");
      if (!idClass) throw new Error("Turma não identificada.");
      await deleteClassDb(idTenant, idBranch, idClass);
      await refetchClasses();
    },
    [idBranch, idTenant, refetchClasses]
  );

  useEffect(() => {
    if (!canUse) {
      setClasses([]);
      setSessions([]);
      return;
    }
    void refetchClasses();
  }, [canUse, refetchClasses]);

  const enrollmentCountsByClassDate = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    sessions.forEach((session) => {
      if (typeof session.enrolledCount !== "number") return;
      const classId = String(session.idClass || "").trim();
      const dateKey = toDateKey(session.sessionDate);
      if (!classId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
      if (!counts[classId]) counts[classId] = {};
      counts[classId][dateKey] = Math.max(0, Number(session.enrolledCount || 0));
    });
    return counts;
  }, [sessions]);

  const createFromScheduleForm = useCallback(
    async (values: ScheduleFormValues): Promise<string[]> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade não identificados.");

      const weekdays = Array.isArray(values.weekDays) ? values.weekDays : [];
      if (weekdays.length === 0) throw new Error("Selecione ao menos um dia da semana.");

      const createdIds: string[] = [];

      for (const wd of weekdays) {
        const payload: ClassPayload = {
          idTenant,
          idBranch,
          idActivity: String(values.idActivity || "").trim(),
          idArea: String(values.idArea || "").trim(),
          idEmployee: String(values.idEmployee || "").trim(),
          weekday: normalizeWeekday(wd),
          startDate: String(values.startDate || "").slice(0, 10),
          endDate: values.endDate ? String(values.endDate).slice(0, 10) : undefined,
          startTime: String(values.startTime || "").trim(),
          endTime: String(values.endTime || "").trim(),
          durationMinutes: Number(values.durationMinutes || 0),
          maxCapacity: Number(values.maxCapacity || 0),
          status: "active",
        };

        const errors = validateClassPayload(payload);
        if (errors.length) throw new Error(errors[0]);

        const id = await createClass(payload);
        createdIds.push(id);
      }

      await refetchClasses();
      return createdIds;
    },
    [idBranch, idTenant, refetchClasses]
  );

  const generateSessionsForRange = useCallback(
    async (
      params: Omit<GenerateSessionsParams, "idTenant" | "idBranch">,
      options?: { skipPrefetch?: boolean }
    ) => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade não identificados.");

      const startDate = String(params.startDate || "").slice(0, 10);
      const endDate = String(params.endDate || "").slice(0, 10);

      setGeneratingSessions(true);
      setError(null);
      try {
        // Load what's already persisted first for faster rendering
        if (!options?.skipPrefetch) {
          await refetchSessions(startDate, endDate);
        }

        const functions = getFunctions();
        const callable = httpsCallable(functions, "generateBranchSessions");
        await callable({ idTenant, idBranch, startDate, endDate });
        await refetchSessions(startDate, endDate);
      } catch (e: any) {
        setError(e?.message || "Erro ao gerar sessões");
        throw e;
      } finally {
        setGeneratingSessions(false);
      }
    },
    [idBranch, idTenant, refetchSessions]
  );

  const applyEnrollmentDeltaForClass = useCallback(
    (idClass: string, startDate: string, endDate: string | undefined, delta: number) => {
      const classId = String(idClass || "").trim();
      if (!classId || !delta) return;

      const startKey = toDateKey(startDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startKey)) return;

      const endKey = endDate ? toDateKey(endDate) : "";
      const hasEnd = endKey && /^\d{4}-\d{2}-\d{2}$/.test(endKey);

      setSessions((prev) =>
        prev.map((session) => {
          if (String(session.idClass || "") !== classId) return session;

          const sessionKey = toDateKey(session.sessionDate);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionKey)) return session;
          if (sessionKey < startKey) return session;
          if (hasEnd && sessionKey > endKey) return session;

          const current = typeof session.enrolledCount === "number" ? session.enrolledCount : 0;
          const next = Math.max(0, current + delta);
          return { ...session, enrolledCount: next };
        })
      );
    },
    []
  );

  const schedulesForGrade = useMemo(() => {
    const classCreatedAtById = new Map<string, unknown>();
    (Array.isArray(classes) ? classes : []).forEach((c) => {
      const key = String((c as any)?.id || "");
      if (!key) return;
      classCreatedAtById.set(key, (c as any)?.createdAt);
    });

    return sessions.map((s) => {
      const classId = String(s.idClass || "");
      const dateKey = toDateKey(s.sessionDate);
      const cachedCount = enrollmentCountsByClassDate?.[classId]?.[dateKey];
      const enrolledCount = typeof cachedCount === "number" ? cachedCount : 0;
      const classCreatedAt = classCreatedAtById.get(classId);

      return {
        id: s.id,
        idClass: s.idClass,
        idActivity: s.idActivity,
        idArea: s.idArea,
        idEmployee: s.idEmployee,
        maxCapacity: s.maxCapacity,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
        sessionDate: s.sessionDate,
        createdAt: classCreatedAt ?? s.createdAt,
        enrolledCount,
      };
    });
  }, [classes, enrollmentCountsByClassDate, sessions]);

  const getEnrollmentCountForDate = useCallback(
    (idClass: string, dateKey: string): number | null => {
      const classId = String(idClass || "").trim();
      const key = toDateKey(dateKey);
      if (!classId || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
      const count = enrollmentCountsByClassDate?.[classId]?.[key];
      return typeof count === "number" ? count : null;
    },
    [enrollmentCountsByClassDate]
  );

  return {
    idTenant,
    idBranch,
    classes,
    sessions,
    schedulesForGrade,
    loading,
    generatingSessions,
    error,
    refetchClasses,
    refetchSessions,
    createFromScheduleForm,
    updateFromScheduleForm,
    deleteClass,
    generateSessionsForRange,
    applyEnrollmentDeltaForClass,
    getEnrollmentCountForDate,
  };
};
