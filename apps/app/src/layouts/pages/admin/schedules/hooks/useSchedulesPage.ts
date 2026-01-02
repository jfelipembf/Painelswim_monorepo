import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormikHelpers } from "formik";

import { useToast } from "context/ToastContext";
import { useReferenceDataCache } from "context/ReferenceDataCacheContext";

import { useConfirmDialog } from "hooks/useConfirmDialog";
import { useClasses, type Weekday } from "hooks/classes";
import { useCollaborators } from "hooks/collaborators";

import { useGradeController } from "../../../grade/hooks/useGradeController";
import { getEventColor } from "../../../grade/utils/grid";

import { SCHEDULE_FORM_INITIAL_VALUES } from "../constants";
import type { ScheduleFormValues } from "../types";

export const useSchedulesPage = () => {
  const grade = useGradeController();

  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const { activitiesById, areasById } = useReferenceDataCache();
  const classes = useClasses();
  const collaborators = useCollaborators();

  const visibleRange = grade.visibleRange;

  const lastGeneratedRangeRef = useRef<string>("");

  useEffect(() => {
    if (!classes.idTenant || !classes.idBranch) return;
    if (classes.generatingSessions) return;

    const startDate = String(visibleRange?.startDate || "").slice(0, 10);
    const endDate = String(visibleRange?.endDate || "").slice(0, 10);
    const key = `${startDate}..${endDate}`;
    if (!startDate || !endDate) return;
    if (lastGeneratedRangeRef.current === key) return;

    lastGeneratedRangeRef.current = key;
    void (async () => {
      try {
        const existing = await classes.refetchSessions(startDate, endDate);
        if (!existing.length) {
          await classes.generateSessionsForRange({ startDate, endDate }, { skipPrefetch: true });
        }
      } catch (e: any) {
        lastGeneratedRangeRef.current = "";
        toast.showError(e?.message || "Erro ao carregar sessões");
      }
    })();
  }, [
    classes.idTenant,
    classes.idBranch,
    classes.generatingSessions,
    classes.generateSessionsForRange,
    classes.refetchSessions,
    toast,
    visibleRange,
  ]);

  const activityOptions = useMemo(() => Object.values(activitiesById || {}), [activitiesById]);
  const areaOptions = useMemo(() => Object.values(areasById || {}), [areasById]);
  const instructorOptions = useMemo(() => {
    const list = Array.isArray(collaborators.collaborators) ? collaborators.collaborators : [];
    return [...list].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [collaborators.collaborators]);

  const instructorsById = useMemo(() => {
    const map: Record<string, any> = {};
    instructorOptions.forEach((c: any) => {
      const id = String(c?.id || "").trim();
      if (id) map[id] = c;
    });
    return map;
  }, [instructorOptions]);

  const schedules = useMemo(() => {
    return classes.schedulesForGrade.map((s) => ({
      ...s,
      activityName: activitiesById?.[String(s.idActivity || "")]?.name,
      employeeName: instructorsById?.[String(s.idEmployee || "")]?.name,
      areaName: areasById?.[String(s.idArea || "")]?.name,
      color: getEventColor(s, activitiesById),
    }));
  }, [activitiesById, areasById, classes.schedulesForGrade, instructorsById]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedEffectiveFromDate, setSelectedEffectiveFromDate] = useState<string | null>(null);

  const selectedClass = useMemo(() => {
    if (!selectedClassId) return null;
    return (
      (Array.isArray(classes.classes) ? classes.classes : []).find(
        (c: any) => String(c.id) === selectedClassId
      ) || null
    );
  }, [classes.classes, selectedClassId]);

  const formInitialValues = useMemo<ScheduleFormValues>(() => {
    if (!selectedClass) return SCHEDULE_FORM_INITIAL_VALUES;
    const weekday = Number(selectedClass.weekday) as Weekday;
    return {
      idActivity: String(selectedClass.idActivity || ""),
      idEmployee: String(selectedClass.idEmployee || ""),
      idArea: String(selectedClass.idArea || ""),
      startDate: String(selectedClass.startDate || ""),
      endDate: String(selectedClass.endDate || ""),
      weekDays: [weekday],
      startTime: String(selectedClass.startTime || ""),
      durationMinutes: Number(selectedClass.durationMinutes || 45),
      endTime: String(selectedClass.endTime || ""),
      maxCapacity: Number(selectedClass.maxCapacity || 6),
    };
  }, [selectedClass]);

  const resetSelection = useCallback(() => {
    setSelectedClassId(null);
    setSelectedScheduleId(null);
    setSelectedEffectiveFromDate(null);
  }, []);

  const handleSelectSchedule = useCallback(
    (schedule: any) => {
      const idClass = String(schedule?.idClass || "").trim();
      if (!idClass) {
        toast.showError("Turma não identificada neste evento.");
        return;
      }
      const fromDate = String(schedule?.sessionDate || "").slice(0, 10);
      setSelectedClassId(idClass);
      setSelectedScheduleId(String(schedule?.id || ""));
      setSelectedEffectiveFromDate(fromDate || null);
    },
    [toast]
  );

  const handleCancel = useCallback(() => {
    resetSelection();
  }, [resetSelection]);

  const handleSubmit = useCallback(
    async (values: ScheduleFormValues, actions: FormikHelpers<ScheduleFormValues>) => {
      try {
        if (selectedClassId) {
          const fromDate = selectedEffectiveFromDate || values.startDate;
          await classes.updateFromScheduleForm(selectedClassId, values, fromDate);
          toast.showSuccess("Turma atualizada com sucesso.");
        } else {
          await classes.createFromScheduleForm(values);
          toast.showSuccess("Turma(s) criada(s) com sucesso.");
        }
        const regenStart = selectedEffectiveFromDate || String(visibleRange?.startDate || "");
        const regenEnd = String(visibleRange?.endDate || "");
        await classes.generateSessionsForRange({
          startDate: regenStart,
          endDate: regenEnd,
        });
        resetSelection();
        actions.resetForm({ values: SCHEDULE_FORM_INITIAL_VALUES });
      } catch (e: any) {
        toast.showError(e?.message || "Erro ao salvar turma");
      } finally {
        actions.setSubmitting(false);
      }
    },
    [classes, resetSelection, selectedClassId, selectedEffectiveFromDate, toast, visibleRange]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const ok = await confirmDialog.confirm({
        title: "Excluir turma?",
        description:
          "Se a turma tiver alunos matriculados ou histórico de matrículas, a exclusão será bloqueada. Esta ação não pode ser desfeita.",
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmColor: "error",
      });
      if (!ok) return;

      await classes.deleteClass(selectedClassId);
      toast.showSuccess("Turma excluída.");
      await classes.generateSessionsForRange(visibleRange);
      resetSelection();
    } catch (e: any) {
      toast.showError(e?.message || "Erro ao excluir turma");
    }
  }, [classes, confirmDialog, resetSelection, selectedClassId, toast, visibleRange]);

  return {
    grade,
    confirmDialog,
    activityOptions,
    areaOptions,
    instructorOptions,
    schedules,
    formInitialValues,
    selectedClassId,
    selectedScheduleId,
    handleSelectSchedule,
    handleSubmit,
    handleCancel,
    handleDelete,
    isLoading: classes.loading,
    isGeneratingSessions: classes.generatingSessions,
  };
};
