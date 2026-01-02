import type { AreaPayload } from "./areas.types";

export const validateAreaPayload = (payload: Partial<AreaPayload>): string[] => {
  const errors: string[] = [];

  if (payload.name !== undefined && !String(payload.name || "").trim()) {
    errors.push("Nome da área é obrigatório.");
  }

  const numbers: Array<[keyof AreaPayload, string]> = [
    ["lengthMeters", "Comprimento"],
    ["widthMeters", "Largura"],
    ["maxCapacity", "Capacidade"],
  ];

  numbers.forEach(([field, label]) => {
    const value = (payload as any)[field];
    if (value === undefined) return;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      errors.push(`${label} inválido.`);
    }
  });

  return errors;
};

export const normalizeAreaPayload = (payload: AreaPayload): AreaPayload => {
  return {
    name: String(payload.name || "").trim(),
    lengthMeters: Number(payload.lengthMeters || 0),
    widthMeters: Number(payload.widthMeters || 0),
    maxCapacity: Number(payload.maxCapacity || 0),
    inactive: Boolean(payload.inactive),
  };
};
