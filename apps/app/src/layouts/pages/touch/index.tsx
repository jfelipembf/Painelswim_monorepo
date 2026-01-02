import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import MDBox from "components/MDBox";

import PageLayout from "examples/LayoutContainers/PageLayout";

import TouchHeader from "./components/TouchHeader";
import DayScheduleColumn from "./components/DayScheduleColumn";
import TouchEvaluationDialog from "./components/TouchEvaluationDialog";

import { buildWaveBackground } from "./utils";

import { useReferenceDataCache } from "context/ReferenceDataCacheContext";

import { useClasses, useCollaborators } from "hooks/clients";

import { getEventColor } from "layouts/pages/grade/utils/grid";

type ScheduleCard = {
  id: string;
  title: string;
  time: string;
};

const toIsoDate = (d: Date): string => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

function TouchPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const classes = useClasses();
  const collaborators = useCollaborators();
  const { activitiesById, areasById } = useReferenceDataCache();

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

  useEffect(() => {
    if (!classes.idTenant || !classes.idBranch) return;
    if (classes.generatingSessions) return;

    const dateKey = toIsoDate(selectedDate);
    void classes.generateSessionsForRange({ startDate: dateKey, endDate: dateKey });
  }, [classes, selectedDate]);

  const dateKey = useMemo(() => toIsoDate(selectedDate), [selectedDate]);

  const sessionsForDay = useMemo(() => {
    const list = Array.isArray(classes.schedulesForGrade) ? classes.schedulesForGrade : [];
    return list.filter((s: any) => String(s?.sessionDate || "").slice(0, 10) === dateKey);
  }, [classes.schedulesForGrade, dateKey]);

  const schedulesWithMeta = useMemo(() => {
    return sessionsForDay
      .map((s: any) => ({
        ...s,
        activityName: activitiesById?.[String(s.idActivity || "")]?.name,
        employeeName: instructorsById?.[String(s.idEmployee || "")]?.name,
        areaName: areasById?.[String(s.idArea || "")]?.name,
      }))
      .sort((a: any, b: any) => String(a.startTime || "").localeCompare(String(b.startTime || "")));
  }, [activitiesById, areasById, instructorsById, sessionsForDay]);

  const scheduleCards = useMemo<ScheduleCard[]>(() => {
    return schedulesWithMeta.map((s: any) => {
      const time = String(s.startTime || "");
      const titleParts = [s.activityName, s.areaName].filter(Boolean);
      const title = titleParts.length ? titleParts.join(" • ") : "Turma";
      const color = getEventColor(s, activitiesById || {});

      return {
        id: String(s.id),
        time,
        title,
        schedule: {
          ...s,
          color,
          activityName: title,
        },
      };
    });
  }, [activitiesById, schedulesWithMeta]);

  useEffect(() => {
    if (selectedScheduleId) return;
    if (!scheduleCards.length) return;
    setSelectedScheduleId(String(scheduleCards[0].id));
  }, [scheduleCards, selectedScheduleId]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setSelectedScheduleId(null);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    setSelectedScheduleId(null);
  };

  const handleClose = () => {
    const from = (location.state as any)?.from;
    if (from) {
      navigate(from);
      return;
    }

    navigate("/grade");
  };

  return (
    <PageLayout background="default">
      <MDBox
        minHeight="100vh"
        width="100%"
        sx={({ palette }) => ({
          background: `linear-gradient(135deg, ${palette.common.white} 0%, #E8F2FF 55%, #D6EBFF 100%)`,
          position: "relative",
          overflow: "hidden",
        })}
      >
        <MDBox
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: buildWaveBackground(),
            backgroundRepeat: "no-repeat",
            backgroundPosition: "bottom center",
            backgroundSize: "cover",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />

        <MDBox position="relative" zIndex={1} px={{ xs: 2, md: 4 }} py={{ xs: 2, md: 3 }}>
          <TouchHeader onClose={handleClose} />

          <MDBox
            mt={{ xs: 2, md: 3 }}
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "360px 1fr" }}
            gap={2.5}
          >
            <MDBox>
              <DayScheduleColumn
                date={selectedDate}
                schedules={scheduleCards}
                activitiesById={activitiesById || {}}
                selectedScheduleId={selectedScheduleId}
                onSelectSchedule={(id) => {
                  setSelectedScheduleId(id);
                }}
                onPrevDay={handlePrevDay}
                onNextDay={handleNextDay}
              />
            </MDBox>

            <MDBox>
              <TouchEvaluationDialog
                schedule={
                  schedulesWithMeta.find((s: any) => String(s.id) === String(selectedScheduleId)) ||
                  null
                }
              />
            </MDBox>
          </MDBox>
        </MDBox>
      </MDBox>
    </PageLayout>
  );
}

export default TouchPage;
