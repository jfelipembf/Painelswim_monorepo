import { useMemo } from "react";

import Box from "@mui/material/Box";
import { Theme } from "@mui/material/styles";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import GradeEventCard from "../GradeEventCard";

import type { GradeTurn, GradeView } from "../../types";
import {
  addDays,
  formatDayHeaderLabel,
  formatISODate,
  isSameDay,
  minutesToTime,
  timeToMinutes,
} from "../../utils/date";
import { isMinutesInTurn } from "../../constants/turns";
import { START_MINUTES, END_MINUTES } from "../../constants/grid";
import { isWithinTurn, occursOnDate } from "../../utils/grid";

const toCreatedAtMillis = (value: any): number => {
  if (!value) return Number.NaN;

  // Firestore Timestamp shape: { seconds, nanoseconds }
  if (typeof value === "object" && value) {
    const seconds = (value as any).seconds;
    const nanos = (value as any).nanoseconds;
    if (Number.isFinite(Number(seconds))) {
      return Number(seconds) * 1000 + (Number(nanos) || 0) / 1_000_000;
    }
  }

  // JS Date
  if (value instanceof Date) {
    return value.getTime();
  }

  // ISO string / number
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : Number.NaN;
  }

  if (typeof value === "number") {
    return value;
  }

  return Number.NaN;
};

type Props = {
  turn: GradeTurn;
  view: GradeView;
  weekStart: Date;
  referenceDate: Date;
  schedules: any[];
  showOccupancy: boolean;
  onSelectSchedule?: (schedule: any) => void;
  selectedScheduleId?: string | null;
  selectedScheduleIds?: string[];
};

function GradeGrid({
  turn,
  view,
  weekStart,
  referenceDate,
  schedules,
  showOccupancy,
  onSelectSchedule,
  selectedScheduleId,
  selectedScheduleIds,
}: Props): JSX.Element {
  const selectedSet = useMemo(() => {
    return new Set((Array.isArray(selectedScheduleIds) ? selectedScheduleIds : []).map(String));
  }, [selectedScheduleIds]);

  const days = useMemo(() => {
    if (view === "day") {
      const d = new Date(referenceDate);
      d.setHours(0, 0, 0, 0);
      return [d];
    }

    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [view, weekStart, referenceDate]);

  const timeRows = useMemo(() => {
    const base = new Set<number>();
    for (let m = START_MINUTES; m <= END_MINUTES; m += 60) {
      if (isMinutesInTurn(turn, m)) base.add(m);
    }

    const visibleScheduleTimes = (Array.isArray(schedules) ? schedules : [])
      .map((s) => String(s?.startTime || ""))
      .filter(Boolean)
      .filter((t) => isWithinTurn(turn, t));

    visibleScheduleTimes.forEach((t) => {
      const mins = timeToMinutes(t);
      if (Number.isFinite(mins) && isMinutesInTurn(turn, mins)) base.add(mins);
    });

    return Array.from(base)
      .sort((a, b) => a - b)
      .map((mins) => ({ mins, label: minutesToTime(mins) }));
  }, [schedules, turn]);

  const schedulesByCell = useMemo(() => {
    const map = new Map<string, any[]>();

    (Array.isArray(schedules) ? schedules : []).forEach((s) => {
      const startTime = String(s?.startTime || "");
      if (!startTime) return;
      if (!isWithinTurn(turn, startTime)) return;

      days.forEach((d) => {
        const iso = formatISODate(d);
        const dayIndex = d.getDay();
        if (!occursOnDate(s, iso, dayIndex)) return;

        const key = `${iso}|${startTime}`;
        map.set(key, [...(map.get(key) || []), s]);
      });
    });

    return map;
  }, [days, schedules, turn]);

  return (
    <MDBox>
      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `96px repeat(${days.length}, minmax(160px, 1fr))`,
          }}
        >
          <Box
            sx={{
              p: 1.5,
              backgroundColor: (theme: Theme) => theme.palette.background.default,
              borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            }}
          />
          {days.map((d) => (
            <Box
              key={formatISODate(d)}
              sx={{
                p: 1.5,
                borderLeft: (theme: Theme) => `1px solid ${theme.palette.divider}`,
                backgroundColor: (theme: Theme) =>
                  isSameDay(d, referenceDate)
                    ? theme.palette.action.hover
                    : theme.palette.background.default,
                borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <MDTypography variant="button" fontWeight="medium">
                {formatDayHeaderLabel(d)}
              </MDTypography>
            </Box>
          ))}

          {timeRows.map((t) => (
            <Box key={t.label} sx={{ display: "contents" }}>
              <Box
                sx={{
                  p: 1.25,
                  borderTop: (theme: Theme) => `1px solid ${theme.palette.divider}`,
                  backgroundColor: (theme: Theme) => theme.palette.background.default,
                }}
              >
                <MDTypography variant="caption" fontWeight="medium">
                  {t.label}
                </MDTypography>
              </Box>

              {days.map((d) => {
                const iso = formatISODate(d);
                const key = `${iso}|${t.label}`;
                const cellSchedules = (schedulesByCell.get(key) || [])
                  .slice()
                  .sort((a: any, b: any) => {
                    const aMs = toCreatedAtMillis(a?.createdAt);
                    const bMs = toCreatedAtMillis(b?.createdAt);
                    const aHas = Number.isFinite(aMs);
                    const bHas = Number.isFinite(bMs);

                    if (aHas && bHas) return aMs - bMs;
                    if (aHas) return -1;
                    if (bHas) return 1;

                    return String(a?.id || "").localeCompare(String(b?.id || ""));
                  });
                const selected = isSameDay(d, referenceDate);

                return (
                  <Box
                    key={`${iso}-${t.label}`}
                    sx={{
                      p: 1,
                      borderLeft: (theme: Theme) => `1px solid ${theme.palette.divider}`,
                      borderTop: (theme: Theme) => `1px solid ${theme.palette.divider}`,
                      minHeight: 44,
                      backgroundColor: (theme: Theme) =>
                        selected ? theme.palette.action.hover : theme.palette.background.paper,
                    }}
                  >
                    {cellSchedules.map((s: any) => (
                      <Box key={s.id} sx={{ mb: 0.75 }}>
                        <GradeEventCard
                          schedule={s}
                          color={s.color}
                          showOccupancyMask={Boolean(showOccupancy)}
                          onClick={onSelectSchedule ? () => onSelectSchedule(s) : undefined}
                          isSelected={
                            selectedSet.size > 0
                              ? selectedSet.has(String(s.id))
                              : selectedScheduleId
                              ? String(s.id) === selectedScheduleId
                              : false
                          }
                        />
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </MDBox>
  );
}

export default GradeGrid;
