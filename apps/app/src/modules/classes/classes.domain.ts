import type { ClassPayload, Weekday } from "./classes.types";

const isIsoDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").slice(0, 10));

export const validateClassPayload = (payload: Partial<ClassPayload>): string[] => {
  const errors: string[] = [];

  if (!payload.idActivity) errors.push("Atividade é obrigatória");
  if (!payload.idArea) errors.push("Área é obrigatória");
  if (!payload.idEmployee) errors.push("Instrutor é obrigatório");

  if (payload.weekday === undefined || payload.weekday === null) {
    errors.push("Dia da semana é obrigatório");
  }

  if (!payload.startDate || !isIsoDate(payload.startDate)) errors.push("Data início inválida");
  if (payload.endDate && !isIsoDate(payload.endDate)) errors.push("Data fim inválida");

  if (!payload.startTime) errors.push("Hora início é obrigatória");
  if (!payload.endTime) errors.push("Hora fim é obrigatória");

  if (!payload.durationMinutes || payload.durationMinutes < 1) errors.push("Duração inválida");
  if (!payload.maxCapacity || payload.maxCapacity < 1) errors.push("Capacidade inválida");

  return errors;
};

export const normalizeWeekday = (value: unknown): Weekday => {
  const n = Number(value);
  const v = Number.isFinite(n) ? n : 0;
  const normalized = ((v % 7) + 7) % 7;
  return normalized as Weekday;
};
