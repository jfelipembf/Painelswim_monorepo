import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import GradeEventCard from "layouts/pages/grade/components/GradeEventCard";
import { getEventColor } from "layouts/pages/grade/utils/grid";

type ScheduleCard = {
  id: string;
  title: string;
  time: string;
  schedule?: any;
};

type Props = {
  date: Date;
  schedules: ScheduleCard[];
  activitiesById?: Record<string, any>;
  selectedScheduleId?: string | null;
  onSelectSchedule?: (id: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
};

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(d);

function DayScheduleColumn({
  date,
  schedules,
  activitiesById,
  selectedScheduleId,
  onSelectSchedule,
  onPrevDay,
  onNextDay,
}: Props): JSX.Element {
  return (
    <Card
      sx={({ palette }) => ({
        p: 2,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.78)",
        border: `1px solid ${palette.divider}`,
        backdropFilter: "blur(10px)",
      })}
    >
      <MDBox display="flex" justifyContent="space-between" alignItems="center" gap={1.5}>
        <MDBox>
          <MDTypography variant="h5" fontWeight="bold">
            {formatDate(date)}
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block" mt={0.25}>
            Selecione uma aula pelo horário
          </MDTypography>
        </MDBox>

        <MDBox display="flex" alignItems="center" gap={1}>
          <IconButton onClick={onPrevDay} aria-label="Dia anterior">
            <Icon>chevron_left</Icon>
          </IconButton>
          <IconButton onClick={onNextDay} aria-label="Próximo dia">
            <Icon>chevron_right</Icon>
          </IconButton>
        </MDBox>
      </MDBox>

      <MDBox mt={2} display="grid" gap={1.25}>
        {schedules.length === 0 ? (
          <MDBox
            p={2}
            borderRadius="lg"
            sx={{
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px dashed rgba(2, 132, 199, 0.35)",
            }}
          >
            <MDTypography variant="button" fontWeight="medium">
              Sem aulas para este dia
            </MDTypography>
          </MDBox>
        ) : (
          schedules.map((s) => {
            const resolved = s.schedule || { id: s.id, startTime: s.time, activityName: s.title };
            const color = getEventColor(resolved, activitiesById || {});

            return (
              <GradeEventCard
                key={s.id}
                schedule={resolved}
                color={color}
                showOccupancyMask={false}
                onClick={
                  onSelectSchedule
                    ? () => {
                        onSelectSchedule(String(s.id));
                      }
                    : undefined
                }
                isSelected={String(selectedScheduleId || "") === String(s.id)}
              />
            );
          })
        )}
      </MDBox>
    </Card>
  );
}

export default DayScheduleColumn;
