import type { EventPlanPayload, EventTypePayload } from "./eventPlan.types";

export const normalizeEventTypePayload = (payload: Partial<EventTypePayload>): EventTypePayload => {
  return {
    name: String(payload.name || "").trim(),
    className: String(payload.className || "info").trim() || "info",
    inactive: Boolean(payload.inactive),
  };
};

export const validateEventTypePayload = (payload: Partial<EventTypePayload>): string[] => {
  const errors: string[] = [];
  const name = String(payload.name || "").trim();
  if (!name) errors.push("Nome do tipo é obrigatório.");
  return errors;
};

export const normalizeEventPlanPayload = (payload: Partial<EventPlanPayload>): EventPlanPayload => {
  return {
    idBranch: payload.idBranch ? String(payload.idBranch).trim() : undefined,
    eventTypeId: String(payload.eventTypeId || "").trim(),
    eventTypeName: String(payload.eventTypeName || "").trim(),
    className: String(payload.className || "info").trim() || "info",
    startAt: String(payload.startAt || "").trim(),
    endAt: payload.endAt ? String(payload.endAt).trim() : undefined,
    allDay: Boolean(payload.allDay),
  };
};

export const validateEventPlanPayload = (payload: Partial<EventPlanPayload>): string[] => {
  const errors: string[] = [];
  if (!String(payload.eventTypeId || "").trim()) errors.push("Tipo de evento é obrigatório.");
  if (!String(payload.eventTypeName || "").trim()) {
    errors.push("Nome do tipo de evento é obrigatório.");
  }
  if (!String(payload.startAt || "").trim()) errors.push("Data inicial é obrigatória.");
  return errors;
};
