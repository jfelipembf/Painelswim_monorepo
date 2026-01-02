import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import { Theme } from "@mui/material/styles";
import Box from "@mui/material/Box";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import GradeHeader from "./components/GradeHeader";
import GradeGrid from "./components/GradeGrid";
import ScheduleEnrollmentsDialog from "./components/ScheduleEnrollmentsDialog";

import { useGradeController } from "./hooks/useGradeController";

import { useToast } from "context/ToastContext";
import { useReferenceDataCache } from "context/ReferenceDataCacheContext";
import { useClasses } from "hooks/classes";
import { useClient } from "hooks/clients";
import { useCollaborators } from "hooks/collaborators";
import { getEventColor } from "./utils/grid";

import { fetchMembershipById } from "hooks/memberships";
import { fetchContractById } from "hooks/contracts";

import {
  createEnrollment,
  fetchClientEnrollments,
  findActiveEnrollmentForClientAndClass,
  isEnrollmentActiveOnDate,
} from "hooks/enrollments";

function GradePage(): JSX.Element {
  const grade = useGradeController();

  const [searchParams] = useSearchParams();
  const mode = String(searchParams.get("mode") || "");
  const clientIdFromQuery = searchParams.get("clientId");
  const isEnrollMode = mode === "enroll" && Boolean(clientIdFromQuery);

  const toast = useToast();
  const { activitiesById, areasById } = useReferenceDataCache();
  const classes = useClasses();
  const collaborators = useCollaborators();
  const client = useClient(clientIdFromQuery, { enabled: Boolean(clientIdFromQuery) });

  const visibleRange = grade.visibleRange;

  const lastRangeRef = useRef<string>("");

  useEffect(() => {
    if (!classes.idTenant || !classes.idBranch) return;
    if (classes.generatingSessions) return;

    const startDate = String(visibleRange?.startDate || "").slice(0, 10);
    const endDate = String(visibleRange?.endDate || "").slice(0, 10);
    const key = `${startDate}..${endDate}`;
    if (!startDate || !endDate) return;
    if (lastRangeRef.current === key) return;

    lastRangeRef.current = key;
    void (async () => {
      try {
        const existing = await classes.refetchSessions(startDate, endDate);
        if (!existing.length) {
          await classes.generateSessionsForRange({ startDate, endDate }, { skipPrefetch: true });
        }
      } catch (e: any) {
        lastRangeRef.current = "";
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

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [enrollAllowedWeekdays, setEnrollAllowedWeekdays] = useState<string[]>([]);
  const [enrollWeeklyLimitDays, setEnrollWeeklyLimitDays] = useState<number>(0);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!isEnrollMode) return;
      if (!classes.idTenant || !classes.idBranch) return;
      if (!clientIdFromQuery) return;

      const activeMembershipId = String((client.data as any)?.activeMembershipId || "").trim();
      if (!activeMembershipId) {
        if (!active) return;
        setEnrollAllowedWeekdays([]);
        setEnrollWeeklyLimitDays(0);
        return;
      }

      try {
        const membership = await fetchMembershipById(
          classes.idTenant,
          classes.idBranch,
          clientIdFromQuery,
          activeMembershipId
        );
        if (!membership || membership.status !== "active") {
          if (!active) return;
          setEnrollAllowedWeekdays([]);
          setEnrollWeeklyLimitDays(0);
          return;
        }

        const contract = await fetchContractById(
          classes.idTenant,
          classes.idBranch,
          String(membership.planId || "")
        );

        if (!active) return;

        const allowedWeekdays = Array.isArray((contract as any)?.allowedWeekdays)
          ? (contract as any).allowedWeekdays.map(String)
          : [];
        setEnrollAllowedWeekdays(allowedWeekdays);

        const limitCount = Number((contract as any)?.accessLimitCount || 0);
        const limitPeriod = String((contract as any)?.accessLimitPeriod || "");
        setEnrollWeeklyLimitDays(limitCount > 0 && limitPeriod === "week" ? limitCount : 0);
      } catch {
        if (!active) return;
        setEnrollAllowedWeekdays([]);
        setEnrollWeeklyLimitDays(0);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [classes.idBranch, classes.idTenant, client.data, clientIdFromQuery, isEnrollMode]);

  const handleScheduleClick = (schedule: any) => {
    const sid = String(schedule.id);
    if (isEnrollMode) {
      const sessionDateKey = String(schedule?.sessionDate || todayKey).slice(0, 10);
      const wd = resolveIsoWeekday(sessionDateKey);

      if (
        enrollAllowedWeekdays.length > 0 &&
        !enrollAllowedWeekdays.map(String).includes(String(wd))
      ) {
        toast.showError("Contrato não permite matrícula neste dia.");
        return;
      }

      if (enrollWeeklyLimitDays > 0) {
        const byId = new Map<string, any>();
        (Array.isArray(schedules) ? schedules : []).forEach((s) => byId.set(String(s.id), s));
        const existingDays = new Set<string>();
        (Array.isArray(selectedScheduleIds) ? selectedScheduleIds : []).forEach((id) => {
          const s = byId.get(String(id));
          if (!s) return;
          const dk = String(s?.sessionDate || todayKey).slice(0, 10);
          existingDays.add(resolveIsoWeekday(dk));
        });

        const isNewDay = !existingDays.has(String(wd));
        if (isNewDay && existingDays.size >= enrollWeeklyLimitDays) {
          toast.showError(
            `O cliente só tem direito a selecionar ${enrollWeeklyLimitDays} dia(s) na semana.`
          );
          return;
        }
      }

      setSelectedScheduleIds((prev) => {
        const set = new Set((Array.isArray(prev) ? prev : []).map(String));
        if (set.has(sid)) set.delete(sid);
        else set.add(sid);
        return Array.from(set);
      });
      return;
    }

    setSelectedScheduleId(sid);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedScheduleId(null);
  };

  const selectedSchedule = schedules.find((s) => String(s.id) === selectedScheduleId);

  const selectedEnrollSchedules = useMemo(() => {
    if (!isEnrollMode) return [];
    const byId = new Map<string, any>();
    (Array.isArray(schedules) ? schedules : []).forEach((s) => byId.set(String(s.id), s));
    return (Array.isArray(selectedScheduleIds) ? selectedScheduleIds : [])
      .map((id) => byId.get(String(id)))
      .filter(Boolean);
  }, [isEnrollMode, schedules, selectedScheduleIds]);

  const todayKey = String(new Date().toISOString()).slice(0, 10);
  const canConfirmEnrollment = Boolean(
    isEnrollMode &&
      clientIdFromQuery &&
      selectedEnrollSchedules.length > 0 &&
      selectedEnrollSchedules.some((s: any) => Boolean(s?.idClass))
  );

  const resolveIsoWeekday = (isoDateKey: string): string => {
    const d = new Date(`${String(isoDateKey).slice(0, 10)}T00:00:00.000Z`);
    return String(d.getUTCDay());
  };

  const handleConfirmEnrollment = async () => {
    if (!classes.idTenant || !classes.idBranch) {
      toast.showError("Academia/unidade não identificada.");
      return;
    }
    if (!clientIdFromQuery) {
      toast.showError("Cliente não identificado.");
      return;
    }

    const idTenant = classes.idTenant;
    const idBranch = classes.idBranch;

    const targets = isEnrollMode
      ? selectedEnrollSchedules
      : selectedSchedule
      ? [selectedSchedule]
      : [];
    const targetsByClass = new Map<string, { idClass: string; sessionDateKey: string }>();

    (Array.isArray(targets) ? targets : []).forEach((t: any) => {
      const idClass = String(t?.idClass || "");
      if (!idClass) return;
      const sessionDateKey = String(t?.sessionDate || todayKey).slice(0, 10);
      const existing = targetsByClass.get(idClass);
      if (!existing || sessionDateKey < existing.sessionDateKey) {
        targetsByClass.set(idClass, { idClass, sessionDateKey });
      }
    });

    if (targetsByClass.size === 0) {
      toast.showError("Selecione ao menos uma turma.");
      return;
    }

    try {
      const activeMembershipId = String((client.data as any)?.activeMembershipId || "").trim();
      if (!activeMembershipId) {
        toast.showError("Cliente não possui contrato ativo.");
        return;
      }

      const membership = await fetchMembershipById(
        idTenant,
        idBranch,
        clientIdFromQuery,
        activeMembershipId
      );
      if (!membership || membership.status !== "active") {
        toast.showError("Cliente não possui contrato ativo.");
        return;
      }

      const startKey = String(membership.startAt || "").slice(0, 10);
      const endKey = membership.endAt ? String(membership.endAt).slice(0, 10) : "";

      if (membership.allowCrossBranchAccess) {
        const allowed = Array.isArray(membership.allowedBranchIds)
          ? membership.allowedBranchIds
          : [];
        if (allowed.length > 0 && !allowed.includes(idBranch)) {
          toast.showError("Contrato não permite matrícula nesta unidade.");
          return;
        }
      } else if (String(membership.idBranch || "") !== idBranch) {
        toast.showError("Contrato não permite matrícula em outra unidade.");
        return;
      }

      const contract = await fetchContractById(idTenant, idBranch, String(membership.planId || ""));
      if (!contract) {
        toast.showError("Contrato não encontrado.");
        return;
      }

      const limitCount = Number(contract.accessLimitCount || 0);
      const limitPeriod = String(contract.accessLimitPeriod || "");

      const allowedWeekdays = Array.isArray(contract.allowedWeekdays)
        ? contract.allowedWeekdays
        : [];
      const requested = Array.from(targetsByClass.values());
      const existingEnrollments =
        limitCount > 0 ? await fetchClientEnrollments(idTenant, idBranch, clientIdFromQuery) : [];
      const existingActiveInPeriod = (dateKey: string) =>
        existingEnrollments.filter((e) => isEnrollmentActiveOnDate(e, dateKey)).length;

      if (limitCount > 0 && limitPeriod === "week") {
        const baselineKey = requested.map((r) => r.sessionDateKey).sort()[0];
        const current = baselineKey ? existingActiveInPeriod(baselineKey) : 0;
        if (current + requested.length > limitCount) {
          toast.showError("Limite de aulas semanais atingido para este contrato.");
          return;
        }
      }

      const createdClassIds = new Set<string>();

      for (const r of requested) {
        const sessionDateKey = r.sessionDateKey;
        if (startKey && sessionDateKey < startKey) {
          toast.showError("Contrato ainda não está válido para esta data.");
          return;
        }
        if (endKey && sessionDateKey > endKey) {
          toast.showError("Contrato expirado.");
          return;
        }

        if (allowedWeekdays.length > 0) {
          const wd = resolveIsoWeekday(sessionDateKey);
          if (!allowedWeekdays.map(String).includes(String(wd))) {
            toast.showError("Contrato não permite matrícula neste dia.");
            return;
          }
        }

        const already = await findActiveEnrollmentForClientAndClass(
          idTenant,
          idBranch,
          clientIdFromQuery,
          r.idClass
        );
        if (already && isEnrollmentActiveOnDate(already, sessionDateKey)) {
          continue;
        }

        const classDoc = (Array.isArray(classes.classes) ? classes.classes : []).find(
          (c: any) => String(c?.id || "") === String(r.idClass)
        );
        const maxCapacity = Number((classDoc as any)?.maxCapacity || 0);
        const sessionCount = classes.getEnrollmentCountForDate?.(r.idClass, sessionDateKey);
        const enrolledCount = typeof sessionCount === "number" ? sessionCount : 0;
        if (Number.isFinite(maxCapacity) && maxCapacity > 0 && enrolledCount >= maxCapacity) {
          toast.showError("Turma lotada.");
          return;
        }

        await createEnrollment({
          idTenant,
          idBranch,
          clientId: clientIdFromQuery,
          idClass: r.idClass,
          status: "active",
          effectiveFrom: sessionDateKey,
        });
        createdClassIds.add(String(r.idClass || ""));
      }

      createdClassIds.forEach((idClass) => {
        const startDateKey = targetsByClass.get(idClass)?.sessionDateKey || todayKey;
        classes.applyEnrollmentDeltaForClass(idClass, startDateKey, endKey || undefined, 1);
      });

      await classes.refetchClasses();
      await new Promise((resolve) => setTimeout(resolve, 350));
      await classes.refetchClasses();
      setSelectedScheduleIds([]);
      toast.showSuccess("Matrícula realizada!");
    } catch (e: any) {
      toast.showError(e?.message || "Erro ao matricular");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ height: "100%" }}>
              <MDBox p={3}>
                <MDBox mb={2}>
                  <MDTypography variant="h5">Grade de Horários</MDTypography>
                </MDBox>

                <MDBox mb={2}>
                  <GradeHeader
                    turn={grade.turn}
                    onTurnChange={grade.setTurn}
                    view={grade.view}
                    onViewChange={grade.setView}
                    referenceDate={grade.referenceDate}
                    onReferenceDateChange={grade.setReferenceDate}
                    showOccupancy={grade.showOccupancy}
                    onShowOccupancyChange={grade.setShowOccupancy}
                  />
                </MDBox>

                {isEnrollMode && (
                  <MDBox mb={2} display="flex" justifyContent="space-between" alignItems="center">
                    <MDTypography variant="button" color="text">
                      Modo matrícula
                      {selectedEnrollSchedules.length ? ` (${selectedEnrollSchedules.length})` : ""}
                    </MDTypography>
                    <MDButton
                      variant="gradient"
                      color="success"
                      size="small"
                      disabled={!canConfirmEnrollment || client.loading}
                      onClick={handleConfirmEnrollment}
                    >
                      Confirmar matrícula
                    </MDButton>
                  </MDBox>
                )}

                <MDBox
                  sx={(theme: Theme) => ({
                    position: "relative",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius * 1.25,
                    overflow: "hidden",
                    backgroundColor: theme.palette.background.paper,
                  })}
                >
                  {(classes.loading || classes.generatingSessions) && (
                    <Box
                      sx={(theme: Theme) => ({
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.palette.background.paper,
                        opacity: 0.7,
                      })}
                    >
                      <CircularProgress color="success" />
                    </Box>
                  )}
                  <GradeGrid
                    turn={grade.turn}
                    view={grade.view}
                    weekStart={grade.weekStart}
                    referenceDate={grade.referenceDate}
                    schedules={schedules}
                    showOccupancy={grade.showOccupancy}
                    onSelectSchedule={handleScheduleClick}
                    selectedScheduleId={selectedScheduleId}
                    selectedScheduleIds={isEnrollMode ? selectedScheduleIds : undefined}
                  />
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {!isEnrollMode && selectedSchedule && (
        <ScheduleEnrollmentsDialog
          open={openModal}
          onClose={handleCloseModal}
          schedule={selectedSchedule}
        />
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default GradePage;
