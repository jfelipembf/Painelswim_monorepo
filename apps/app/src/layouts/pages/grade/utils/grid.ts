import type { GradeTurn } from "../types";
import { isMinutesInTurn } from "../constants/turns";
import { timeToMinutes } from "./date";

export const getEventColor = (
  schedule: any,
  activitiesById: Record<string, any>
): string | null => {
  const activityId = schedule?.idActivity ? String(schedule.idActivity) : "";
  const activityColor = activityId ? activitiesById?.[activityId]?.color : null;
  if (activityColor) return String(activityColor);

  const fallback = schedule?.color || schedule?.colorHex || schedule?.borderColor || null;
  return fallback ? String(fallback) : null;
};

export const isWithinTurn = (turn: GradeTurn, startTime: string): boolean => {
  const m = timeToMinutes(startTime);
  if (!Number.isFinite(m)) return false;
  return isMinutesInTurn(turn, m);
};

export const occursOnDate = (schedule: any, isoDate: string, dayIndex: number): boolean => {
  const sessionDate = schedule?.sessionDate || schedule?.activityDate || null;
  if (sessionDate) {
    return String(sessionDate).slice(0, 10) === String(isoDate);
  }

  const weekDays = Array.isArray(schedule?.weekDays) ? schedule.weekDays : [];
  if (!weekDays.includes(dayIndex)) return false;

  const startDate = schedule?.startDate || null;
  const endDate = schedule?.endDate || null;

  if (startDate && String(isoDate) < String(startDate)) return false;
  if (endDate && String(isoDate) > String(endDate)) return false;

  return true;
};
