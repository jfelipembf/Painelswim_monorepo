import type { Weekday } from "hooks/classes";

export type ScheduleFormValues = {
  idActivity: string;
  idEmployee: string;
  idArea: string;
  startDate: string;
  endDate: string;
  weekDays: Weekday[];
  startTime: string;
  durationMinutes: number;
  endTime: string;
  maxCapacity: number;
};
