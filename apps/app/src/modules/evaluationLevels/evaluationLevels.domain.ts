import type { EvaluationLevelPayload } from "./evaluationLevels.types";

export const normalizeEvaluationLevelPayload = (
  payload: Partial<EvaluationLevelPayload>
): EvaluationLevelPayload => {
  return {
    name: String(payload.name || "").trim(),
    value: Number(payload.value || 0),
    order: typeof payload.order === "number" ? Math.round(payload.order) : undefined,
    inactive: Boolean(payload.inactive),
  };
};

export const validateEvaluationLevelPayload = (
  payload: Partial<EvaluationLevelPayload>
): string[] => {
  const errors: string[] = [];
  const normalized = normalizeEvaluationLevelPayload(payload);

  if (!normalized.name) errors.push("Nome é obrigatório.");

  const value = Number(normalized.value);
  if (Number.isNaN(value)) errors.push("Valor inválido.");

  return errors;
};
