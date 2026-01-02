import type { ServicePayload } from "./services.types";

export const validateServicePayload = (payload: Partial<ServicePayload>): string[] => {
  const errors: string[] = [];

  if (payload.name !== undefined && !String(payload.name || "").trim()) {
    errors.push("Nome do serviço é obrigatório.");
  }

  if (payload.priceCents !== undefined) {
    const n = Number(payload.priceCents);
    if (!Number.isFinite(n) || n < 0) {
      errors.push("Preço inválido.");
    }
  }

  if (payload.durationMinutes !== undefined) {
    const n = Number(payload.durationMinutes);
    if (!Number.isFinite(n) || n <= 0) {
      errors.push("Duração inválida.");
    }
  }

  return errors;
};

export const normalizeServicePayload = (payload: ServicePayload): ServicePayload => {
  return {
    ...payload,
    name: String(payload.name || "").trim(),
    description: payload.description ? String(payload.description).trim() : "",
    priceCents: Math.round(Number(payload.priceCents || 0)),
    durationMinutes: Math.round(Number(payload.durationMinutes || 0)),
    inactive: Boolean(payload.inactive),
  };
};
