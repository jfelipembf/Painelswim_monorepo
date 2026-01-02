import type { ScheduleFormValues } from "../types";

export const SCHEDULE_FORM_INITIAL_VALUES: ScheduleFormValues = {
  idActivity: "",
  idEmployee: "",
  idArea: "",
  startDate: "",
  endDate: "",
  weekDays: [],
  startTime: "",
  durationMinutes: 45,
  endTime: "",
  maxCapacity: 6,
};
