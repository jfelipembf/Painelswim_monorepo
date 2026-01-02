import type { ActivityPayload } from "./activities.types";

export const validateActivityPayload = (payload: Partial<ActivityPayload>): string[] => {
  const errors: string[] = [];

  if (payload.name !== undefined && !String(payload.name || "").trim()) {
    errors.push("Nome da atividade é obrigatório.");
  }

  if (payload.color !== undefined && !String(payload.color || "").trim()) {
    errors.push("Cor da atividade é obrigatória.");
  }

  const statusProvided = payload.status !== undefined;
  const statusIsValid = payload.status === "active" || payload.status === "inactive";
  if (statusProvided && !statusIsValid) {
    errors.push("Status inválido.");
  }

  return errors;
};

export const normalizeActivityPayload = (payload: ActivityPayload): ActivityPayload => {
  return {
    ...payload,
    name: String(payload.name || "").trim(),
    description: payload.description ? String(payload.description).trim() : "",
    color: String(payload.color || "").trim(),
    status: payload.status === "inactive" ? "inactive" : "active",
    shareWithOtherUnits: Boolean(payload.shareWithOtherUnits),
    photoUrl: payload.photoUrl ? String(payload.photoUrl).trim() : undefined,
    objectives: Array.isArray(payload.objectives) ? payload.objectives : [],
  };
};
